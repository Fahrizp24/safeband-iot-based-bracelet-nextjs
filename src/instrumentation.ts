import * as Sentry from '@sentry/nextjs';

const sentryOptions: Sentry.NodeOptions | Sentry.EdgeOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  spotlight: process.env.NODE_ENV === 'development',
  sendDefaultPii: true,
  tracesSampleRate: 1,
  debug: false
};

export async function register() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DISABLED) {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      Sentry.init(sentryOptions);
    }

    if (process.env.NEXT_RUNTIME === 'edge' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
      try {
        Sentry.init(sentryOptions);
      } catch (e) {
        console.error("Sentry Edge Init Error:", e);
      }
    }
  }

  // -------------------------------------------------------------------------
  // 2. INTEGRASI RADAR FIREBASE LISTENER
  // -------------------------------------------------------------------------
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { initializeApp, getApps, cert } = await import('firebase-admin/app');
      const { getFirestore } = await import('firebase-admin/firestore');

      if (!getApps().length) {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY 
          ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
          : undefined;

        if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
          throw new Error("Firebase Admin SDK credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) tidak ditemukan di .env");
        }

        initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
          }),
        });
      }

      const db = getFirestore();
      console.log('📡 [BACKGROUND WORKER] Radar Firebase Aktif berdampingan dengan Sentry...');

      // Memulai listener pada collection 'devices'
      db.collection('devices').onSnapshot(async (snapshot) => {
        if (snapshot.empty || snapshot.docChanges().length === 0) return;

        for (const change of snapshot.docChanges()) {
          if (change.type === 'modified' || change.type === 'added') {
            const deviceData = change.doc.data();
            const deviceSn = change.doc.id;
            
            // PERBAIKAN 1: Membaca 'fallStatus' atau 'condition' dari IoT secara fleksibel
            const currentCondition = (deviceData?.fallStatus || deviceData?.condition || '').toLowerCase();

            if (currentCondition === 'danger' || currentCondition === 'fall') {
              console.log(`🚨 [ALERT DETECTED] Status Device ${deviceSn} dalam kondisi BAHAYA!`);

              try {
                // Berikan jeda sedikit (1.5 detik) agar data insiden dari MQTT masuk ke Firestore
                await new Promise((resolve) => setTimeout(resolve, 1500));

                // 1. Ambil data insiden terakhir untuk device terkait
                const incidentSnapshot = await db.collection('incidents')
                  .where('deviceSn', '==', deviceSn)
                  .orderBy('timestamp', 'desc')
                  .limit(1)
                  .get();

                if (incidentSnapshot.empty) {
                  console.log(`[WORKER] Data rincian insiden untuk ${deviceSn} belum masuk.`);
                  continue;
                }

                const lastIncidentDoc = incidentSnapshot.docs[0];
                const incidentData = lastIncidentDoc.data();
                const incidentId = lastIncidentDoc.id;

                const userEmail = deviceData?.userId;
                if (!userEmail) {
                  console.log(`[WORKER] Device ${deviceSn} tidak memiliki userId (email).`);
                  continue;
                }

                // 2. Tarik relasi data user untuk mengambil informasi nama korban
                const userDoc = await db.collection('users').doc(userEmail).get();
                if (!userDoc.exists) {
                  console.log(`[WORKER] Dokumen user dengan email ${userEmail} tidak ditemukan.`);
                  continue;
                }
                const userData = userDoc.data();

                const forceVal = incidentData?.accelerometerForce ? Number(incidentData.accelerometerForce).toFixed(2) : "-";
                const tiltVal = incidentData?.tilt ? Number(incidentData.tilt).toFixed(1) : "-";
                const timeVal = incidentData?.timestamp || new Date().toLocaleString('id-ID');
                
                // PERBAIKAN 2: Sesuaikan pembacaan nested object 'coordinates' dari IoT ESP32
                const lat = incidentData?.coordinates?.latitude ?? incidentData?.latitude ?? -7.94374333;
                const lng = incidentData?.coordinates?.longitude ?? incidentData?.longitude ?? 112.6146443;

                // PERBAIKAN 3: Membetulkan format Link Google Maps asli agar bisa diklik langsung di Telegram
                const googleMapsLink = `https://www.google.com/maps?q=${lat},${lng}`;

                // -------------------------------------------------------------------------
                // 3. SETTING TELEGRAM BOT API
                // -------------------------------------------------------------------------
                const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN; 
                const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID; 

                if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
                  console.error("❌ [TELEGRAM ERROR] Token atau Chat ID belum dikonfigurasi di file .env");
                  continue;
                }

                const telegramMessage = 
`🚨 *PERINGATAN INSIDEN JATUH (SOS)* 🚨
--------------------------------------------------
Sistem mendeteksi adanya kondisi *DARURAT* pada pengguna alat ini!

*Detail Korban:*
• *Nama Pengguna:* ${userData?.name || "Pengguna Sabuk"}
• *No. Darurat Wali:* ${userData?.emergencyContact || "-"}

*Detail Sensor Hardware:*
• *Device SN:* ${deviceSn}
• *Incident ID:* ${incidentId}
• *Gaya Akselerometer:* ${forceVal} G
• *Kemiringan (Tilt):* ${tiltVal}°
• *Waktu Kejadian:* ${timeVal}

*Lokasi Koordinat Korban:*
📍 [Klik untuk Buka Google Maps](${googleMapsLink})
--------------------------------------------------
Mohon segera lakukan pengecekan darurat ke lokasi tersebut!`;

                // 4. TEMBAK LANGSUNG KE API TELEGRAM
                const telegramResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: telegramMessage,
                    parse_mode: 'Markdown'
                  })
                });

                const telegramResult = await telegramResponse.json();
                if (telegramResult.ok) {
                  console.log(`✅ [TELEGRAM SUCCESS] Notifikasi bahaya sukses terkirim ke Telegram Chat ID: ${TELEGRAM_CHAT_ID}`);
                } else {
                  console.error('❌ [TELEGRAM ERROR]', telegramResult);
                }
                // -------------------------------------------------------------------------

              } catch (err: any) {
                console.error('[WORKER ERROR Inside]', err.message);
              }
            }
          }
        }
      });
    } catch (outerError: any) {
      console.error('❌ [BACKGROUND WORKER CRASH] Gagal menginisialisasi Firebase Listener:', outerError.message);
    }
  }
}

export const onRequestError = Sentry.captureRequestError;
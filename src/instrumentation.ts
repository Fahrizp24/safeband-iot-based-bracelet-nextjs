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

      const serviceAccount = require('../firebase-service-account.json');

      if (!getApps().length) {
        initializeApp({
          credential: cert(serviceAccount),
        });
      }

      const db = getFirestore();
      console.log('📡 [BACKGROUND WORKER] Radar Firebase Aktif berdampingan dengan Sentry...');

      // Memulai listener pada collection 'devices'
      db.collection('devices').onSnapshot(async (snapshot) => {
        if (snapshot.empty || snapshot.docChanges().length === 0) return;

        for (const change of snapshot.docChanges()) {
          // Menggunakan 'added' dan 'modified' untuk mengantisipasi alat yang baru dinyalakan/langsung danger
          if (change.type === 'modified' || change.type === 'added') {
            const deviceData = change.doc.data();
            const deviceSn = change.doc.id;
            
            // Berdasarkan gambar 1, field status bernama 'condition' (bernilai "SAFE" atau mungkin "FALL"/"DANGER")
            // Kamu bisa sesuaikan, di sini saya cek case-insensitive agar aman
            const currentCondition = deviceData?.condition?.toLowerCase();

            if (currentCondition === 'danger' || currentCondition === 'fall' || deviceData?.fallStatus === 'danger') {
              console.log(`🚨 [ALERT DETECTED] Status Device ${deviceSn} dalam kondisi BAHAYA!`);

              try {
                // Berikan jeda sedikit (misal 1-2 detik) agar data di collection 'incidents' 
                // dari hardware ESP32 sempat masuk terlebih dahulu ke Firestore.
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

                // Berdasarkan Gambar 3, dokumen di collection 'users' menggunakan ID email langsung 
                // dan di Gambar 1 device menyimpan field 'userId' berisi email tersebut
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
                const lat = incidentData?.latitude ?? -7.94374333;
                const lng = incidentData?.longitude ?? 112.6146443;

                // FIX TYPO: Perbaikan format link Google Maps asli
                const googleMapsLink = `https://maps.google.com/?q=${lat},${lng}`;

                // -------------------------------------------------------------------------
                // 3. SETTING TELEGRAM BOT API
                // -------------------------------------------------------------------------
                const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN; // GANTI DENGAN TOKEN ASLI
                
                // Ambil Chat ID dinamis dari data user jika ada, jika tidak ada pakai fallback default
                const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID; 

                // Susun format pesan menggunakan Markdown gaya Telegram (Gunakan '*' untuk tebal)
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
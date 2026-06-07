// src/app/api/sensor/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/firebase';
// 🟢 TANDAI DIRUBAH: Menambahkan impor query, where, dan getDocs untuk mencari kontak baru
import { doc, getDoc, setDoc, addDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Interface Validator Super Ketat
const sensorSchema = z.object({
  deviceSn: z.string().min(1),
  status: z.enum(['SAFE', 'FALL_DETECTED']),
  batteryLevel: z.number().min(0).max(100),
  location: z.object({ lat: z.number(), lng: z.number() }).optional(),
});

export type SensorData = z.infer<typeof sensorSchema>;

// GET bisa digunakan untuk debug data terbaru via URL (contoh: /api/sensor?sn=ESP32-001)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sn = searchParams.get('sn');

  if (!sn) {
    return NextResponse.json({ 
      message: "API Sensor Berjalan Mulus",
      usage: "/api/sensor?sn=DEVICE_ID" 
    });
  }

  try {
    const deviceRef = doc(db, 'devices', sn);
    const snap = await getDoc(deviceRef);
    
    if (!snap.exists()) {
      return NextResponse.json({ success: false, message: "Device not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: snap.data() });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Firebase error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();
    
    // Validasi Zod
    const validData = sensorSchema.parse(rawBody);

    // 1. Catat ke Koleksi DEVICES (Update Status Terkini)
    const deviceRef = doc(db, 'devices', validData.deviceSn);
    
    // 🟢 TANDAI DIRUBAH: Mengambil data device saat ini untuk mendapatkan UID Pemilik (userId: "2NtcMorZx...")
    const deviceSnap = await getDoc(deviceRef);
    let ownerId = null;

    if (deviceSnap.exists()) {
      ownerId = deviceSnap.data().userId; 
    }

    await setDoc(deviceRef, {
      ...validData,
      lastUpdate: new Date().toISOString(),
      isActive: true
    }, { merge: true });

    // 2. Jika Jatuh, Catat ke Koleksi INCIDENTS (Rekam Jejak)
    if (validData.status === 'FALL_DETECTED') {
      await addDoc(collection(db, 'incidents'), {
        deviceSn: validData.deviceSn,
        type: 'FALL_DETECTED',
        location: validData.location || null,
        isResolved: false,
        timestamp: new Date().toISOString()
      });

      // 🟢 TANDAI DIRUBAH: Jika UID Pemilik ditemukan, cari info kontak darurat di collection baru
      if (ownerId) {
        const contactQuery = query(
          collection(db, 'emergency_contacts'),
          where('userId', '==', ownerId)
        );
        const contactSnapshot = await getDocs(contactQuery);

        if (!contactSnapshot.empty) {
          const contactData = contactSnapshot.docs[0].data();
          
          // 🟢 TANDAI DIRUBAH: Mengekstrak 3 field baru sesuai formulir
          const elderlyName = contactData.elderlyName;
          const contactName = contactData.contactName;
          const whatsappNumber = contactData.whatsappNumber;

          // Eksekusi fungsi kirim notifikasi WhatsApp dengan parameter data baru
          await sendWhatsAppNotification({
            to: whatsappNumber,
            contactName,
            elderlyName,
            location: validData.location
          });
        } else {
          console.log(`[Warning] Kontak darurat untuk UID ${ownerId} belum disetup.`);
        }
      }
    }

    return NextResponse.json({ success: true, message: "Data logged to Firestore" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues }, { status: 400 });
    }
    console.error("API Sensor Error:", error);
    return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
  }
}

// 🟢 TANDAI DIRUBAH: Menambahkan Fungsi Utilitas Pengiriman WhatsApp Gateway Safeband
interface WhatsAppPayload {
  to: string;
  contactName: string;
  elderlyName: string;
  location?: { lat: number; lng: number };
}

async function sendWhatsAppNotification({ to, contactName, elderlyName, location }: WhatsAppPayload) {
  try {
    const mapsLink = location 
      ? `https://maps.google.com/?q=${location.lat},${location.lng}` 
      : 'Koordinat lokasi tidak tersedia';

    const message = `🚨 *PEMBERITAHUAN DARURAT SAFEBAND* 🚨\n\n` +
                    `Halo ${contactName},\n` +
                    `Sistem Safeband mendeteksi bahwa *${elderlyName}* baru saja mengalami insiden jatuh.\n\n` +
                    `📍 *Lokasi Terakhir:* \n${mapsLink}\n\n` +
                    `Mohon segera lakukan pengecekan situasi secepatnya!`;

    console.log(`[WhatsApp Bot] Mengirim pesan ke ${to}...`);
    console.log(`[Isi Pesan]:\n`, message);

    // TODO: Pasang fetch API integrasi Fonnte / Wablas kamu di sini jika sudah siap
    /*
    await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { 'Authorization': 'TOKEN_API_KAMU' },
      body: new URLSearchParams({ target: to, message: message })
    });
    */
  } catch (err) {
    console.error("Gagal mengirim pesan WhatsApp:", err);
  }
}
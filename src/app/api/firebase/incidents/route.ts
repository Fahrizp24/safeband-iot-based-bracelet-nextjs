// src/app/api/firebase/incidents/route.ts
import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { getApps, initializeApp, cert } from 'firebase-admin/app';

export async function GET() {
  try {
    // 1. Parsing Private Key dengan aman dari .env
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    // 2. Cek kelengkapan credentials (SEKARANG AMAN KARENA DI DALAM FUNGSI GET)
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
      return NextResponse.json(
        { success: false, error: "Credentials Firebase Admin belum lengkap di env" },
        { status: 500 }
      );
    }

    // 3. Inisialisasi Firebase App jika belum pernah dibuat
    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
    }

    const db = getFirestore();

    // 4. Ambil log insiden dari koleksi Firestore
    const snapshot = await db.collection('incidents').orderBy('timestamp', 'desc').get();

    const incidentsData = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        deviceSn: data.deviceSn || 'Unknown',
        accelerometerForce: data.accelerometerForce !== undefined ? data.accelerometerForce : '',
        tilt: data.tilt !== undefined ? data.tilt : '',
        latitude: data.latitude || '0',
        longitude: data.longitude || '0',
        timestamp: data.timestamp || '',
        type: data.type || 'JATUH',
      };
    });

    // 5. Kembalikan response sukses tanpa cache agar selalu up-to-date
    return NextResponse.json({ success: true, data: incidentsData }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });

  } catch (error: any) {
    console.error("Gagal mengambil data dari Firestore:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
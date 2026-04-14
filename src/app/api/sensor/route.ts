// src/app/api/sensor/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore';

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
    }

    return NextResponse.json({ success: true, message: "Data logged to Firestore" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
  }
}

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, setDoc, doc, Timestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB1W9mNn_Go8f-hhK5N_ol5Eax55TJuvPM",
  authDomain: "smart-band-334da.firebaseapp.com",
  projectId: "smart-band-334da",
  storageBucket: "smart-band-334da.firebasestorage.app",
  messagingSenderId: "390190233643",
  appId: "1:390190233643:web:8dacceb2b37f1bc88a126e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const dummyData = [
  {
    user: { email: "aliando@gmail.com", name: "Aliando Syarief", password: "password123", role: "customer", deviceSn: "ESP32-004" },
    device: { status: "active", condition: "SAFE", batteryLevel: 92 },
    incidents: [
      { type: "HEART_RATE_ANOMALY", status: "resolved", force: null, lat: -7.95, lng: 112.61, daysAgo: 2 }
    ]
  },
  {
    user: { email: "maya@yahoo.com", name: "Bunda Maya", password: "password123", role: "customer", deviceSn: "ESP32-005" },
    device: { status: "active", condition: "SAFE", batteryLevel: 45 },
    incidents: [
      { type: "FALL_DETECTED", status: "resolved", force: 4.5, lat: -7.98, lng: 112.63, daysAgo: 5 }
    ]
  },
  {
    user: { email: "jono.koperasi@mail.com", name: "Pak Jono", password: "password123", role: "customer", deviceSn: "ESP32-006" },
    device: { status: "active", condition: "FALL", batteryLevel: 67 },
    incidents: [
      { type: "FALL_DETECTED", status: "open", force: 6.2, lat: -7.91, lng: 112.65, daysAgo: 0 } // Hari ini, OPEN!
    ]
  },
  {
    user: { email: "sarah.med@hospital.com", name: "Dr. Sarah", password: "password123", role: "customer", deviceSn: "ESP32-007" },
    device: { status: "active", condition: "SAFE", batteryLevel: 100 },
    incidents: [] // Belum pernah jatuh
  },
  {
    user: { email: "ahmad.dani@musik.com", name: "Ahmad Dani", password: "password123", role: "customer", deviceSn: "ESP32-008" },
    device: { status: "active", condition: "SAFE", batteryLevel: 15 },
    incidents: [
      { type: "BATTERY_CRITICAL", status: "open", force: null, lat: null, lng: null, daysAgo: 0 }
    ]
  }
];

async function seedMassiveData() {
  console.log("Memulai injeksi 5 Pengguna, Perangkat, beserta Riwayat Insiden...");

  for (const data of dummyData) {
    const { email, deviceSn, name } = data.user;
    
    // 1. Buat Document USER
    await setDoc(doc(db, "users", email), {
      ...data.user,
      createdAt: new Date().toISOString()
    });
    console.log(`[USER] Berhasil dibuat: ${name} (${email})`);

    // 2. Buat Document DEVICE
    await setDoc(doc(db, "devices", deviceSn), {
      sn: deviceSn,
      userId: email,
      ownerName: name,
      registeredAt: new Date().toISOString(),
      status: data.device.status,
      condition: data.device.condition,
      batteryLevel: data.device.batteryLevel,
      lastUpdated: Timestamp.now()
    });
    console.log(`[DEVICE] Berhasil ditambahkan: ${deviceSn} - Baterai ${data.device.batteryLevel}%`);

    // 3. Buat Document INCIDENTS
    for (const inc of data.incidents) {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * inc.daysAgo);
      const ts = Timestamp.fromDate(pastDate);
      
      const incidentPayload: any = {
        deviceSn: deviceSn,
        userId: email,
        type: inc.type,
        status: inc.status,
        timestamp: ts,
        occuredAt: ts,
      };

      if (inc.force) incidentPayload.accelerometerForce = inc.force;
      if (inc.lat && inc.lng) incidentPayload.coordinates = { latitude: inc.lat, longitude: inc.lng };
      else incidentPayload.coordinates = "Tidak ada letak geospasial terdeteksi";

      await addDoc(collection(db, "incidents"), incidentPayload);
      console.log(`  -> [INCIDENT] Tercatat: ${inc.type} (${inc.status})`);
    }
  }

  console.log("✅ Injeksi Massive Data Selesai Penuh! Silakan cek web.");
  process.exit(0);
}

seedMassiveData();

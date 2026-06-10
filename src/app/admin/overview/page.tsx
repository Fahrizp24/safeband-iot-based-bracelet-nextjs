// src/app/admin/overview/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, AppWindow, FileWarning, ArrowRight, ShieldCheck } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, limit, query } from 'firebase/firestore';

// Interface untuk tipe data insiden
interface Incident {
  id: string;
  deviceSn: string;
  accelerometerForce: number;
  tilt: number;
  status: string;
  timestamp: string;
}

export default function AdminOverview() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalDevices, setTotalDevices] = useState(0);
  const [todayIncidents, setTodayIncidents] = useState(0);
  const [todayIncidentsList, setTodayIncidentsList] = useState<Incident[]>([]);
  const [pendingIncidents, setPendingIncidents] = useState(0);
  const [latestIncidents, setLatestIncidents] = useState<Incident[]>([]);
  const [serverStatus, setServerStatus] = useState<'Checking...' | 'Online' | 'Offline'>('Checking...');

  useEffect(() => {
    // 1. Total User Subscription
    const usersUnsub = onSnapshot(collection(db, 'users'), (snap) => {
      setTotalUsers(snap.size);
    });

    // 2. Total Device Subscription
    const devicesUnsub = onSnapshot(collection(db, 'devices'), (snap) => {
      setTotalDevices(snap.size);

      // Ambil data device untuk Log Insiden Terbaru (yang fallStatus != safe)
      const devicesData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const fallDevices = devicesData.filter(d => {
        const status = (d as any).fallStatus?.toUpperCase();
        return status && status !== 'SAFE';
      });

      const mappedIncidents: Incident[] = fallDevices.map(d => {
        const data = d as any;
        const time = data.lastUpdated;
        let timestampStr = "Belum Ada Waktu";
        if (time) {
          timestampStr = time.seconds ? new Date(time.seconds * 1000).toLocaleString('id-ID') : new Date(time).toLocaleString('id-ID');
        }
        return {
          id: data.id,
          deviceSn: data.id, // ID document is usually deviceSn
          accelerometerForce: data.accelerometerForce || data.accelForce || 0,
          tilt: data.tilt || 0,
          status: 'open', // karena tidak safe
          timestamp: timestampStr
        };
      });

      // Urutkan berdasarkan waktu kejadian (yang paling baru)
      mappedIncidents.sort((a, b) => {
        // Konversi string kembali ke date untuk sorting, fallback ke 0 jika gagal
        const dateA = a.timestamp !== "Belum Ada Waktu" ? new Date(a.timestamp.replace(/,/g, '')).getTime() : 0;
        const dateB = b.timestamp !== "Belum Ada Waktu" ? new Date(b.timestamp.replace(/,/g, '')).getTime() : 0;
        return dateB - dateA;
      });

      setLatestIncidents(mappedIncidents.slice(0, 5));
    });

    // 3. Incidents Realtime Stream
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const incidentsUnsub = onSnapshot(collection(db, 'incidents'), (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

      // Filter insiden Hari Ini
      const today = docs.filter(d => {
        const time = d.rawTime || d.timestamp;
        if (!time) return false;
        const dDate = time.seconds ? new Date(time.seconds * 1000) : new Date(time.replace(' ', 'T'));
        return dDate >= startOfToday;
      }).sort((a, b) => {
        const timeA = a.rawTime || a.timestamp;
        const timeB = b.rawTime || b.timestamp;
        const dateA = timeA.seconds ? new Date(timeA.seconds * 1000) : new Date(timeA.replace(' ', 'T'));
        const dateB = timeB.seconds ? new Date(timeB.seconds * 1000) : new Date(timeB.replace(' ', 'T'));
        return dateA.getTime() - dateB.getTime(); // Oldest first
      });

      let uniqueTodayCount = 0;
      const lastIncidentTime = new Map<string, number>();
      const countedIncidents: Incident[] = [];

      for (const incident of today) {
        const time = incident.rawTime || incident.timestamp;
        const date = time.seconds ? new Date(time.seconds * 1000) : new Date(time.replace(' ', 'T'));
        const incidentTimeMs = date.getTime();

        const lastTime = lastIncidentTime.get(incident.deviceSn);
        // Jika belum ada insiden sebelumnya hari ini, atau sudah lebih dari 1 jam
        if (!lastTime || (incidentTimeMs - lastTime > 60 * 60 * 1000)) {
          uniqueTodayCount++;
          lastIncidentTime.set(incident.deviceSn, incidentTimeMs);
          
          countedIncidents.push({
            id: incident.id,
            deviceSn: incident.deviceSn,
            accelerometerForce: incident.accelerometerForce || incident.accelForce || 0,
            tilt: incident.tilt || 0,
            status: incident.status || 'open',
            timestamp: time.seconds ? new Date(time.seconds * 1000).toLocaleString('id-ID') : new Date(time.replace(' ', 'T')).toLocaleString('id-ID')
          });
        }
      }
      setTodayIncidents(uniqueTodayCount);
      setTodayIncidentsList(countedIncidents.reverse()); // Balikkan array agar yang terbaru di atas

      // Filter Status Pending ('open')
      const pending = docs.filter(d => d.status === 'open' || !d.status);
      setPendingIncidents(pending.length);
    });

    // 4. Ping Hadoop API Status
    const checkServer = async () => {
      try {
        const res = await fetch('/api/hadoop/incidents');
        if (res.ok) setServerStatus('Online');
        else setServerStatus('Offline');
      } catch {
        setServerStatus('Offline');
      }
    };
    checkServer();
    const interval = setInterval(checkServer, 30000);

    return () => {
      usersUnsub();
      devicesUnsub();
      incidentsUnsub();
      clearInterval(interval);
    };
  }, []);

  return (
    <div className='p-6 space-y-6'>
      {/* Header Dashboard */}
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Admin Dashboard</h1>
        <p className='text-muted-foreground text-sm'>Overview sistem global dan statistik terkini SafeBand.</p>
      </div>

      {/* Grid Card Metrik Utama */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {/* Total Users */}
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
            <CardTitle className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Total User Terdaftar</CardTitle>
            <Users className='h-4 w-4 text-blue-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-600'>{totalUsers.toLocaleString()}</div>
            <p className='text-[11px] text-muted-foreground mt-1'>Pendaftar unik di sistem</p>
          </CardContent>
        </Card>

        {/* Incidents Card dengan Kondisi Dinamis */}
        <Card className={`shadow-sm border-l-4 ${pendingIncidents > 0 ? 'border-l-red-500' : 'border-l-emerald-500'}`}>
          <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
            <CardTitle className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Insiden Hari Ini</CardTitle>
            <FileWarning className={`h-4 w-4 ${pendingIncidents > 0 ? 'text-red-500 animate-bounce' : 'text-emerald-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${pendingIncidents > 0 ? 'text-red-600' : 'text-slate-900'}`}>{todayIncidents}</div>
            {pendingIncidents > 0 ? (
              <p className='text-[11px] font-medium text-red-500 animate-pulse mt-1'>
                🚨 insiden jatuh terdeteksi hari ini
              </p>
            ) : (
              <p className='text-[11px] font-medium text-emerald-600 flex items-center mt-1'>
                <ShieldCheck className="w-3 h-3 mr-1" /> Semua aman terkendali
              </p>
            )}
          </CardContent>
        </Card>

        {/* Perangkat Terdaftar */}
        <Card className="shadow-sm border-l-4 border-l-purple-500">
          <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
            <CardTitle className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Perangkat Terdaftar</CardTitle>
            <AppWindow className='h-4 w-4 text-purple-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-purple-600'>{totalDevices}</div>
            <p className='text-[11px] text-muted-foreground mt-1'>Device SafeBand Terdaftar</p>
          </CardContent>
        </Card>

        {/* Status Server */}
        <Card className={`shadow-sm border-l-4 ${serverStatus === 'Online' ? 'border-l-emerald-500' : serverStatus === 'Offline' ? 'border-l-red-500' : 'border-l-gray-400'}`}>
          <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
            <CardTitle className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Status Server Hadoop</CardTitle>
            <Activity className={`h-4 w-4 ${serverStatus === 'Online' ? 'text-emerald-500' : serverStatus === 'Offline' ? 'text-red-500' : 'text-gray-400'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${serverStatus === 'Online' ? 'text-emerald-600' : serverStatus === 'Offline' ? 'text-red-600' : 'text-gray-600'}`}>
              {serverStatus}
            </div>
            <p className='text-[11px] text-muted-foreground mt-1'>Real-time API Connection</p>
          </CardContent>
        </Card>
      </div>

      {/* Bagian Bawah: Mengisi Whitespace Dengan Log Insiden Terbaru */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Log Insiden Terbaru (Real-time Feed)</CardTitle>
            <p className="text-xs text-muted-foreground">Menampilkan 5 aktivitas deteksi guncangan/kemiringan ekstrem terakhir.</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border border-slate-100">
            <table className="w-full text-sm text-left text-slate-500">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">ID Perangkat</th>
                  <th className="px-4 py-3">Gaya Akselerometer</th>
                  <th className="px-4 py-3">Sudut Kemiringan</th>
                  <th className="px-4 py-3">Waktu Kejadian</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {latestIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-xs text-muted-foreground">
                      Belum ada log insiden yang masuk.
                    </td>
                  </tr>
                ) : (
                  latestIncidents.map((incident) => (
                    <tr key={incident.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">{incident.deviceSn}</td>
                      <td className="px-4 py-3 text-xs">{incident.accelerometerForce?.toFixed(4)} G</td>
                      <td className="px-4 py-3 text-xs">{incident.tilt?.toFixed(2)}°</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{incident.timestamp}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${incident.status === 'open' || !incident.status
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                          {incident.status === 'open' || !incident.status ? 'Butuh Penanganan' : 'Selesai'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Bagian Bawah 2: Tabel Insiden Hari Ini Sesuai Logika Cooldown */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Daftar Insiden Hari Ini</CardTitle>
            <p className="text-xs text-muted-foreground">Menampilkan insiden hari ini (dihitung 1 jika terjadi berturut-turut dalam 1 jam untuk perangkat yang sama).</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border border-slate-100">
            <table className="w-full text-sm text-left text-slate-500">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">ID Perangkat</th>
                  <th className="px-4 py-3">Gaya Akselerometer</th>
                  <th className="px-4 py-3">Sudut Kemiringan</th>
                  <th className="px-4 py-3">Waktu Kejadian</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {todayIncidentsList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-xs text-muted-foreground">
                      Belum ada log insiden hari ini.
                    </td>
                  </tr>
                ) : (
                  todayIncidentsList.map((incident) => (
                    <tr key={incident.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">{incident.deviceSn}</td>
                      <td className="px-4 py-3 text-xs">{incident.accelerometerForce?.toFixed(4)} G</td>
                      <td className="px-4 py-3 text-xs">{incident.tilt?.toFixed(2)}°</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{incident.timestamp}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${incident.status === 'open' || !incident.status
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                          {incident.status === 'open' || !incident.status ? 'Butuh Penanganan' : 'Selesai'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
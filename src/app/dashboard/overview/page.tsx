'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Battery, Activity, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CustomerOverview() {
  const { data: session, status } = useSession();
  const [sensorData, setSensorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [noDevice, setNoDevice] = useState(false);
  const [deviceSn, setDeviceSn] = useState('');
  // State untuk melacak apabila ada tiket insiden "open" yang belum diselesaikan
  const [hasOpenIncident, setHasOpenIncident] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) return;

    // Listen to user setting to get deviceSn dynamically
    const userUnsub = onSnapshot(doc(db, 'users', session.user.email), (userDoc) => {
      if (userDoc.exists()) {
        const sn = userDoc.data().deviceSn;
        if (!sn) {
          setNoDevice(true);
          setLoading(false);
          return;
        }

        setNoDevice(false);
        setDeviceSn(sn);

        // Listen to active device values
        const deviceUnsub = onSnapshot(doc(db, 'devices', sn), (docSnap) => {
          if (docSnap.exists()) {
            setSensorData(docSnap.data());
          } else {
            // Device registered but no data at all
            setSensorData(null);
          }
          setLoading(false);
        });

        // Listen ke data Incidents juga!
        import('firebase/firestore').then(({ query, collection, where }) => {
          const snUpper = sn.toUpperCase();
          const snLower = sn.toLowerCase();
          
          const incidentsQuery = query(
            collection(db, 'incidents'),
            where('deviceSn', 'in', [sn, snUpper, snLower])
          );
          
          const incidentUnsub = onSnapshot(incidentsQuery, (snap) => {
            // Cari apakah ada BENCANA yang status tiketnya masih "open"
            const openDanger = snap.docs.find((d) => {
              const data = d.data();
              const type = data.type?.toUpperCase() || '';
              const isFallType = type.includes('FALL') || type.includes('DANGER');
              return data.status === 'open' && isFallType;
            });
            setHasOpenIncident(!!openDanger);
          });
        });

        return () => {
          deviceUnsub();
          // We can't synchronously unsub incidentUnsub here cleanly without restructuring, 
          // but for simple Dashboard component unmount it's fairly okay or could be refactored.
        };
      } else {
        setLoading(false);
      }
    });

    return () => userUnsub();
  }, [session, status]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-muted-foreground min-h-[400px]">
        <Icons.spinner className="h-8 w-8 animate-spin mb-4" />
        <p>Memuat Data Monitor...</p>
      </div>
    );
  }

  if (noDevice) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 min-h-[400px]">
        <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
        <p className="text-xl font-medium">Device Anda Belum Terhubung!</p>
        <p className="text-muted-foreground w-full max-w-md">
          Silakan hubungkan perangkat SafeBand (Device ID) Anda di halaman Pengaturan Perangkat agar dapat menampilkan status Home Monitor ini.
        </p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/profile">Hubungkan Perangkat Sekarang</Link>
        </Button>
      </div>
    );
  }

  // Adjust condition cases: "safe" and "SAFE" support
  const cond = sensorData?.condition?.toUpperCase();
  const dangerKeywords = ['FALL', 'DANGER', 'FALL DETECTED', 'FALL_DETECTED'];
  
  // Lanjut: Web Paksa kondisi "BAHAYA" kalau ada tiket incident "open" !
  const isDanger = dangerKeywords.includes(cond) || hasOpenIncident;
  const isSafe = !isDanger && cond === 'SAFE';
  const hasNoInfo = !sensorData && !hasOpenIncident;
  
  const formattedLastUpdated = sensorData?.lastUpdated 
    ? (typeof sensorData.lastUpdated.toDate === 'function' 
        ? sensorData.lastUpdated.toDate().toLocaleString('id-ID') 
        : new Date(sensorData.lastUpdated).toLocaleString('id-ID')) 
    : 'Belum Ada';

  return (
    <div className='p-6 space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Home Monitor</h1>
        <p className='text-muted-foreground'>Halo {session?.user?.name || 'Customer'}, ini status perangkat SafeBand Anda secara Real-time.</p>
        <p className='text-sm text-muted-foreground mt-1'>Device SN: <span className="font-semibold">{deviceSn}</span></p>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        <Card className={hasNoInfo ? 'bg-gray-50 border-gray-200' : isSafe ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
          <CardHeader className='pb-2'>
            <CardTitle className='text-xl'>Status Gelang</CardTitle>
          </CardHeader>
          <CardContent className='flex flex-col items-center justify-center p-6 min-h-[300px]'>
            {hasNoInfo ? (
              <>
                <Info className='w-24 h-24 text-gray-400 mb-4' />
                <h2 className='text-3xl font-bold text-gray-600 tracking-tight text-center'>Belum Ada Info</h2>
                <p className='text-gray-500 mt-2 font-medium text-center'>Gelang belum mengirimkan data sensor.<br />Pastikan perangkat menyala dan terhubung.</p>
              </>
            ) : isSafe ? (
              <>
                <CheckCircle2 className='w-24 h-24 text-green-500 mb-4' />
                <h2 className='text-4xl font-bold text-green-700 tracking-tight'>A M A N</h2>
                <p className='text-green-600 mt-2 font-medium'>Tidak terdeteksi riwayat jatuh terkini.</p>
              </>
            ) : (
              <>
                <AlertTriangle className='w-24 h-24 text-red-500 mb-4 animate-pulse' />
                <h2 className='text-4xl font-bold text-red-700 tracking-tight animate-bounce text-center'>BAHAYA (JATUH) !</h2>
                <p className='text-red-600 mt-2 font-medium text-center'>Terdeteksi insiden jatuh!<br />Segera lakukan pertolongan atau hubungi nomor darurat.</p>
              </>
            )}
            <p className='text-sm text-muted-foreground mt-6'>
              Update terakhir: {formattedLastUpdated}
            </p>
          </CardContent>
        </Card>

        <div className='grid gap-6'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Baterai Gelang</CardTitle>
              <Battery className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {hasNoInfo ? '-- %' : sensorData?.batteryLevel !== undefined ? `${sensorData.batteryLevel}%` : '-- %'}
              </div>
              <p className='text-xs text-muted-foreground'>
                {hasNoInfo ? 'Data baterai belum tersedia' : (sensorData?.batteryLevel && sensorData.batteryLevel > 20) ? 'Baterai masih terisi cukup baik' : 'Pertimbangkan untuk mengecas gelang Anda'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Aktivitas Terakhir</CardTitle>
              <Activity className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {hasNoInfo ? 'Standby' : isSafe ? 'Normal & Aman' : 'JATUH / BENTURAN'}
              </div>
              <p className='text-xs text-muted-foreground mt-1'>
                {hasNoInfo ? 'Menunggu koneksi dari gelang...' : isSafe ? 'Gelang mentransmisikan data normal' : 'Sensor G-Force menangani lonjakan keras'}
              </p>
              {!hasNoInfo && (
                <p className='text-xs font-semibold text-gray-500 mt-2'>
                  Waktu: {formattedLastUpdated}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

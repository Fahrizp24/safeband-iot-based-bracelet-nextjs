'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, AlertTriangle, CheckCircle2, Info, Wifi, MapPin, Clock } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function LocationCell({ lat, lng }: { lat: string | number; lng: string | number }) {
  const [locationName, setLocationName] = useState<string>('Mencari...');

  useEffect(() => {
    if (!lat || !lng || parseFloat(lat.toString()) === 0) {
      setLocationName('Sinyal GPS Hilang');
      return;
    }

    const latitude = parseFloat(lat.toString());
    const longitude = parseFloat(lng.toString());

    if (latitude <= -7.94 && latitude >= -7.96 && longitude >= 112.60 && longitude <= 112.62) {
      setLocationName('Lowokwaru, Kota Malang');
      return;
    }

    const fetchRealLocation = async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`);
        const data = await res.json();
        const address = data?.address;
        
        const kecamatan = address?.suburb || address?.village || address?.neighbourhood || address?.municipality || '';
        const kota = address?.city || address?.town || address?.regency || address?.county || '';
        
        if (kecamatan && kota) {
          setLocationName(`${kecamatan}, ${kota}`);
        } else if (kota) {
          setLocationName(kota);
        } else {
          setLocationName('Luar Wilayah');
        }
      } catch (error) {
        setLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }
    };

    fetchRealLocation();
  }, [lat, lng]);

  return (
    <a 
      href={`https://maps.google.com/?q=${lat},${lng}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium bg-blue-50/60 hover:bg-blue-100/70 px-2.5 py-0.5 rounded-full border border-blue-100/50 transition-all"
    >
      <MapPin className="h-3 w-3 text-blue-500 shrink-0" />
      <span className="truncate max-w-[140px]">{locationName}</span>
    </a>
  );
}

export default function CustomerOverview() {
  const { data: session, status } = useSession();
  const [sensorData, setSensorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [noDevice, setNoDevice] = useState(false);
  const [deviceSn, setDeviceSn] = useState('');
  // State untuk melacak apabila ada tiket insiden "open" yang belum diselesaikan
  const [hasOpenIncident, setHasOpenIncident] = useState(false);
  const [latestLocation, setLatestLocation] = useState<{lat: string | number, lng: string | number} | null>(null);

  // Fungsi untuk fetch dari Hadoop API
  const fetchHadoopData = async (sn: string) => {
    try {
      const res = await fetch(`/api/hadoop/incidents?deviceId=${sn}`);
      const json = await res.json();
      
      if (json.success && json.data.length > 0) {
        // Menyisir array dari indeks 0 (terbaru) ke bawah untuk mencari koordinat asli
        const fallbackIncident = json.data.find((item: any) => {
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lng);
          return !isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0);
        });
        
        if (fallbackIncident) {
          setLatestLocation({ lat: fallbackIncident.lat, lng: fallbackIncident.lng });
        }
      }
    } catch (error) {
      console.error("Gagal fetch data hadoop", error);
    }
  };

  useEffect(() => {
    if (deviceSn) {
      fetchHadoopData(deviceSn);
      const interval = setInterval(() => {
        fetchHadoopData(deviceSn);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [deviceSn]);

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

        // Listen ke data Incidents 
        import('firebase/firestore').then(({ query, collection, where }) => {
          const snUpper = sn.toUpperCase();
          const snLower = sn.toLowerCase();
          
          const incidentsQuery = query(
            collection(db, 'incidents'),
            where('deviceSn', 'in', [sn, snUpper, snLower])
          );
          
          const incidentUnsub = onSnapshot(incidentsQuery, (snap) => {
            // Cari apakah ada incident yang status tiketnya masih "open"
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

  const handleResolveIncident = async () => {
    if (!deviceSn) return;
    try {
      const deviceRef = doc(db, 'devices', deviceSn);
      // Menggunakan setDoc dengan merge: true akan membuat kolom/field jika belum ada,
      // sekaligus memperbarui nilainya jika sudah ada.
      await setDoc(deviceRef, {
        fallStatus: 'safe',
      }, { merge: true });
    } catch (error) {
      console.error("Gagal mengupdate status insiden:", error);
    }
  };

  // Adjust fallstatus cases: "safe" and "SAFE" support
  const cond = sensorData?.fallStatus?.toUpperCase();
  const dangerKeywords = ['FALL', 'DANGER', 'FALL DETECTED', 'FALL_DETECTED'];
  
  // Lanjut: Web kondisi "BAHAYA" kalau ada tiket incident "open" !
  const isDanger = dangerKeywords.includes(cond) || hasOpenIncident;
  const isSafe = !isDanger && cond === 'SAFE';
  const hasNoInfo = !sensorData?.fallStatus && !hasOpenIncident;
  
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

      <div className='grid gap-4 md:grid-cols-2'>
        {/* KARTU 1: STATUS CHESTBELT (ROW SPAN 2) */}
        <Card className="md:row-span-2 border-gray-200 relative overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
          <div className={`absolute top-0 left-0 w-1.5 h-full ${hasNoInfo ? 'bg-gray-300' : isSafe ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <CardHeader className='flex flex-row items-center justify-between space-y-0 p-4 pb-0'>
            <CardTitle className='text-[10px] font-bold text-gray-400 uppercase tracking-widest'>Status Chestbelt</CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col items-center justify-center text-center">
            {hasNoInfo ? (
              <>
                <div className="bg-gray-50 p-4 rounded-full mb-3">
                  <Info className='w-10 h-10 text-gray-400' />
                </div>
                <h2 className='text-2xl font-bold text-gray-700 tracking-tight'>Belum Ada Info</h2>
                <p className='text-gray-500 mt-2 font-medium text-xs max-w-xs'>Chestbelt belum mengirimkan data sensor.</p>
              </>
            ) : isDanger ? (
              <>
                <div className="bg-red-50 p-4 rounded-full mb-3">
                  <AlertTriangle className='w-10 h-10 text-red-500 animate-pulse' />
                </div>
                <h2 className='text-3xl font-black text-red-600 tracking-tight'>BAHAYA!</h2>
                <p className='text-red-700 mt-2 font-medium text-xs max-w-xs'>Terdeteksi insiden jatuh!</p>
                <Button 
                  onClick={handleResolveIncident}
                  variant="destructive" 
                  size="sm"
                  className="mt-4 font-bold rounded-full px-6"
                >
                  Tandai Insiden Teratasi
                </Button>
              </>
            ) : (
              <>
                <div className="bg-emerald-50 p-4 rounded-full mb-3">
                  <CheckCircle2 className='w-10 h-10 text-emerald-500' />
                </div>
                <h2 className='text-3xl font-black text-emerald-600 tracking-tight'>AMAN</h2>
                <p className='text-emerald-700 mt-2 font-medium text-xs'>Tidak terdeteksi riwayat jatuh.</p>
              </>
            )}
            
            <div className="mt-6">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                Pembaruan: {formattedLastUpdated}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KARTU 2: STATUS KONEKSI */}
        <Card className="border-gray-200 relative overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300">
          <div className={`absolute top-0 left-0 w-1 h-full ${hasNoInfo ? 'bg-gray-300' : 'bg-blue-500'}`} />
          <CardHeader className='flex flex-row items-center justify-between space-y-0 p-4 pb-2'>
            <CardTitle className='text-[10px] font-bold text-gray-400 uppercase tracking-widest'>Status Koneksi</CardTitle>
            <Wifi className={`h-4 w-4 ${hasNoInfo ? 'text-gray-400' : 'text-blue-500'}`} />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className={`text-xl font-bold ${hasNoInfo ? 'text-gray-400' : 'text-blue-600'}`}>
              {hasNoInfo ? 'Terputus' : 'Online'}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              {hasNoInfo ? 'Perangkat tidak terdeteksi di jaringan.' : 'Chestbelt terhubung stabil ke jaringan.'}
            </p>
          </CardContent>
        </Card>
        
        {/* KARTU 3: AKTIVITAS TERAKHIR */}
        <Card className="border-gray-200 relative overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300">
          <div className={`absolute top-0 left-0 w-1 h-full ${hasNoInfo ? 'bg-gray-300' : isDanger ? 'bg-red-500' : 'bg-emerald-500'}`} />
          <CardHeader className='flex flex-row items-center justify-between space-y-0 p-4 pb-2'>
            <CardTitle className='text-[10px] font-bold text-gray-400 uppercase tracking-widest'>Aktivitas Terakhir</CardTitle>
            <Activity className={`h-4 w-4 ${hasNoInfo ? 'text-gray-400' : isDanger ? 'text-red-500' : 'text-emerald-500'}`} />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div>
              <div className={`text-xl font-bold ${hasNoInfo ? 'text-gray-400' : isDanger ? 'text-red-600' : 'text-emerald-600'}`}>
                {hasNoInfo ? 'Standby' : isDanger ? 'JATUH / BENTURAN' : 'Normal & Aman'}
              </div>
              <p className='text-xs text-muted-foreground mt-1'>
                {hasNoInfo ? 'Menunggu log dari chestbelt...' : isDanger ? 'Sensor menangani lonjakan keras.' : 'Pergerakan wajar tanpa anomali.'}
              </p>
            </div>
            
            {!hasNoInfo && (
              <div className="space-y-2 mt-3 pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase">Waktu Kejadian</p>
                  <p className="text-xs font-medium text-gray-700">{formattedLastUpdated}</p>
                </div>
                {(latestLocation || (sensorData?.lat && sensorData?.lng && parseFloat(sensorData?.lat) !== 0)) && (
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase">Lokasi GPS</p>
                    <div className="text-xs">
                      <LocationCell 
                        lat={latestLocation?.lat || sensorData.lat} 
                        lng={latestLocation?.lng || sensorData.lng} 
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

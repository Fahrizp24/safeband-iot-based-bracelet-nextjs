'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSession } from 'next-auth/react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Icons } from '@/components/icons';
import { AlertTriangle, MapPin, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';


const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

// Helper component to recenter map when position changes
function RecenterMap({ lat, lng }: { lat: number, lng: number }) {
  const map = (require('react-leaflet') as any).useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export default function TrackingPage() {
  const { data: session, status } = useSession();
  const [position, setPosition] = useState<{lat: number, lng: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const [noDevice, setNoDevice] = useState(false);
  const [deviceSn, setDeviceSn] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [incidentDetail, setIncidentDetail] = useState<any>(null);

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
          // Syarat: format angka valid dan bukan koordinat kosongan (0,0)
          return !isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0);
        });
        
        // Jika ditemukan log (terbaru maupun log lama) yang punya koordinat asli
        if (fallbackIncident) {
          const lat = parseFloat(fallbackIncident.lat);
          const lng = parseFloat(fallbackIncident.lng);
          
          setPosition({ lat, lng });
          setIncidentDetail(fallbackIncident);
          
          let dateStr = 'Unknown';
          if (fallbackIncident.timestamp) {
             const t = new Date(fallbackIncident.timestamp);
             dateStr = isNaN(t.getTime()) ? fallbackIncident.timestamp : t.toLocaleString('id-ID');
          }
          setLastUpdated(dateStr);
        } else {
          // Opsional: Jika seluruh log di Hadoop ternyata bernilai 0,0
          console.warn("Semua log data GPS untuk device ini bernilai 0,0");
        }
      }
    } catch (error) {
      console.error("Gagal fetch data hadoop", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) return;

    // Fix icon issue by importing leaflet dynamically
    import('leaflet').then((L) => {
      const DefaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28],
        shadowSize: [41, 41]
      });
      L.Marker.prototype.options.icon = DefaultIcon;
    });

    // Listen to user setting to get deviceSn dynamically
    const userUnsub = onSnapshot(doc(db, 'users', session.user.email), (userDoc) => {
      if (userDoc.exists()) {
        const sn = userDoc.data().deviceSn;
        if (!sn) {
          setNoDevice(true);
          setLoading(false);
          setDeviceSn('');
          return;
        }

        setNoDevice(false);
        setDeviceSn(sn);
      } else {
        setLoading(false);
      }
    });

    return () => userUnsub();
  }, [session, status]);

  // Polling data dari Hadoop jika deviceSn tersedia
  useEffect(() => {
      if (deviceSn) {
          setLoading(true);
          fetchHadoopData(deviceSn);

          const interval = setInterval(() => {
              fetchHadoopData(deviceSn);
          }, 10000);

          return () => clearInterval(interval);
      }
  }, [deviceSn]);

  if (status === 'loading' || loading && !position) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-muted-foreground min-h-[400px]">
        <Icons.spinner className="h-8 w-8 animate-spin mb-4" />
        <p>Memuat Peta Pelacakan dari Hadoop...</p>
      </div>
    );
  }

  if (noDevice) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 min-h-[400px]">
        <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
        <p className="text-xl font-medium">Device Belum Terhubung!</p>
        <p className="text-muted-foreground w-full max-w-md">
          Hubungkan perangkat SafeBand Anda di halaman Profil agar data lokasi dapat dilacak.
        </p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/profile">Hubungkan Perangkat</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className='p-6 space-y-6'>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className='text-3xl font-bold'>Live Tracking</h1>
          <p className='text-muted-foreground text-sm flex items-center gap-1.5'>
            <History className="h-4 w-4" />
            Menampilkan lokasi berdasarkan Aktivitas Terakhir (Log Hadoop).
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="font-mono text-xs">{deviceSn}</Badge>
            {lastUpdated && <span className="text-xs text-muted-foreground italic">Waktu Rekam: {lastUpdated}</span>}
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-none shadow-premium bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-red-500" />
            <CardTitle>Titik Lokasi Terakhir</CardTitle>
          </div>
          <CardDescription>Peta menunjukkan koordinat di mana kejadian terakhir terdeteksi.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='h-[550px] w-full rounded-xl overflow-hidden bg-muted border-2 border-muted shadow-inner relative'>
            {position ? (
              <MapContainer 
                center={[position.lat, position.lng]} 
                zoom={16} 
                scrollWheelZoom={true} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[position.lat, position.lng]}>
                  <Popup className="premium-popup">
                    <div className="p-1">
                      <p className="font-bold text-red-600">LOKASI TERAKHIR</p>
                      <p className="text-xs font-semibold">{incidentDetail?.type || 'Aktivitas Normal'}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Waktu: {lastUpdated}</p>
                    </div>
                  </Popup>
                </Marker>
                <RecenterMap lat={position.lat} lng={position.lng} />
              </MapContainer>
            ) : (
              <div className='flex flex-col items-center justify-center h-full text-center p-8'>
                <div className="w-16 h-16 bg-muted-foreground/10 rounded-full flex items-center justify-center mb-4">
                  <MapPin className="h-8 w-8 text-muted-foreground animate-bounce" />
                </div>
                <h3 className="font-semibold text-lg">Tidak Ada Data Lokasi</h3>
                <p className="text-muted-foreground text-sm max-w-xs mt-1">
                  Belum ada log aktivitas dari perangkat <strong>{deviceSn}</strong> di Hadoop.
                </p>
                <Button variant="outline" size="sm" asChild className="mt-4">
                    <Link href="/dashboard/activity">Buka Activity Logs</Link>
                </Button>
              </div>
            )}
          </div>
          
          {position && (
            <div className='mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className="bg-muted/50 p-4 rounded-lg border flex flex-col items-center justify-center text-center">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Latitude</span>
                <span className="text-lg font-mono font-bold text-red-600">{position.lat.toFixed(6)}</span>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg border flex flex-col items-center justify-center text-center">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Longitude</span>
                <span className="text-lg font-mono font-bold text-red-600">{position.lng.toFixed(6)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

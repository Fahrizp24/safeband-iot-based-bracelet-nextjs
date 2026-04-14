'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSession } from 'next-auth/react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Icons } from '@/components/icons';
import { AlertTriangle, MapPin, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet default icon issue in Next.js
import L from 'leaflet';

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

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) return;

    // Fix icon issue
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

        // Ambil Data dari activity/incident terakhir (Sesuai Permintaan User)
        const incidentsQuery = query(
          collection(db, 'incidents'),
          where('deviceSn', 'in', [sn, sn.toUpperCase(), sn.toLowerCase()])
        );

        const logsUnsub = onSnapshot(incidentsQuery, (snapshot) => {
          if (!snapshot.empty) {
            // Sort manual by timestamp descending untuk menghindari index error di Firestore
            const docs = snapshot.docs.map(d => {
              const data = d.data();
              // Mendukung field 'occuredAt' (dari alat) atau 'timestamp' (dari API)
              const logTime = data.occuredAt || data.timestamp;
              
              let timeValue = 0;
              if (logTime) {
                // Mendukung format Firebase Timestamp (.toDate()) atau String biasa
                timeValue = typeof logTime.toDate === 'function' 
                  ? logTime.toDate().getTime() 
                  : new Date(logTime).getTime();
              }

              return { 
                id: d.id, 
                ...data,
                rawTime: timeValue
              };
            }) as any[];
            
            // Urutkan DESC (Terbaru di index 0)
            docs.sort((a, b) => b.rawTime - a.rawTime);
            
            const latestIncident = docs[0];
            const loc = latestIncident.location || latestIncident.coordinates;
            
            if (loc) {
              const lat = loc.lat || loc.latitude;
              const lng = loc.lng || loc.longitude;
              
              if (typeof lat === 'number' && typeof lng === 'number') {
                setPosition({ lat, lng });
                setIncidentDetail(latestIncident);
                setLastUpdated(new Date(latestIncident.rawTime).toLocaleString('id-ID'));
              }
            }
          }
          setLoading(false);
        });

        return () => logsUnsub();
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
        <p>Memuat Peta Pelacakan...</p>
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
            Menampilkan lokasi berdasarkan Aktivitas Terakhir (Log Insiden).
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="font-mono text-xs">{deviceSn}</Badge>
            {lastUpdated && <span className="text-xs text-muted-foreground italic">Waktu Insiden: {lastUpdated}</span>}
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-none shadow-premium bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-red-500" />
            <CardTitle>Titik Lokasi Insiden</CardTitle>
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
                      <p className="font-bold text-red-600">LOKASI INSIDEN</p>
                      <p className="text-xs font-semibold">{incidentDetail?.type || 'Jatuh Terdeteksi'}</p>
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
                <h3 className="font-semibold text-lg">Tidak Ada Data Aktivitas</h3>
                <p className="text-muted-foreground text-sm max-w-xs mt-1">
                  Belum ada log insiden yang tercatat untuk perangkat <strong>{deviceSn}</strong>. Lokasi akan muncul otomatis jika terdeteksi aktivitas jatuh.
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
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Latitude (G-Force Location)</span>
                <span className="text-lg font-mono font-bold text-red-600">{position.lat.toFixed(6)}</span>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg border flex flex-col items-center justify-center text-center">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Longitude (G-Force Location)</span>
                <span className="text-lg font-mono font-bold text-red-600">{position.lng.toFixed(6)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, CheckCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import Link from 'next/link';

export default function ActivityLogsPage() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [noDevice, setNoDevice] = useState(false);

  useEffect(() => {
    if (!session?.user?.email) return;

    // Listen to user document to get the latest deviceSn
    const userUnsub = onSnapshot(doc(db, "users", session.user.email), (docSnap) => {
      if (docSnap.exists()) {
        const deviceSn = docSnap.data().deviceSn;
        if (!deviceSn) {
          setNoDevice(true);
          setLoading(false);
          setLogs([]);
          return;
        }

        setNoDevice(false);
        // Pastikan mencari huruf besar dan kecil agar tidak ada bug Case Sensitive
        const snUpper = deviceSn.toUpperCase();
        const snLower = deviceSn.toLowerCase();
        
        const q = query(
          collection(db, 'incidents'),
          // 'in' memungkinkan pencarian array hingga 10 elemen. 
          where('deviceSn', 'in', [deviceSn, snUpper, snLower])
        );

        const logsUnsub = onSnapshot(q, (snapshot) => {
          const newLogs = snapshot.docs.map(logDoc => {
            const data = logDoc.data();
            
            // Handle Firebase Timestamp or fallback
            let dateStr = 'Unknown';
            const logTime = data.occuredAt || data.timestamp;
            if (logTime) {
                dateStr = typeof logTime.toDate === 'function' 
                   ? logTime.toDate().toLocaleString('id-ID') 
                   : new Date(logTime).toLocaleString('id-ID');
            }

            // Construct notes/location string dynamically
            let locStr = '';
            if (data.coordinates) {
               if (data.coordinates.latitude !== undefined) {
                   locStr = `Lokasi: ${data.coordinates.latitude}, ${data.coordinates.longitude}`;
               } else if (typeof data.coordinates === 'string') {
                   locStr = data.coordinates;
               }
            }
            if (data.accelerometerForce) {
               locStr = locStr ? `G-Force: ${data.accelerometerForce}G | ${locStr}` : `G-Force: ${data.accelerometerForce}G`;
            }

            return {
              id: logDoc.id,
              ...data,
              date: dateStr,
              typeDisplay: data.type || 'Insiden Baru',
              notes: locStr || '-',
              isDanger: data.type === 'FALL DETECTED' || data.type === 'FALL_DETECTED',
              handlingStatus: data.status || 'open',
              rawTime: logTime ? (typeof logTime.toDate === 'function' ? logTime.toDate().getTime() : new Date(logTime).getTime()) : 0
            };
          });
          
          // Sort descending manually
          newLogs.sort((a, b) => b.rawTime - a.rawTime);
          
          setLogs(newLogs);
          setLoading(false);
        });

        return () => logsUnsub();
      } else {
        setLoading(false);
      }
    });

    return () => userUnsub();
  }, [session]);

  const resolveLog = async (id: string) => {
    try {
      await updateDoc(doc(db, 'incidents', id), {
        status: 'resolved'
      });
      toast.success("Insiden ditandai Selesai ditangani");
    } catch(e) {
      toast.error("Gagal update status log");
    }
  };

  return (
    <div className='p-6 space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Activity Logs</h1>
        <p className='text-muted-foreground'>Riwayat kejadian dan log aktivitas SafeBand Anda.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Aktivitas</CardTitle>
          <CardDescription>Menampilkan log insiden dan aktivitas perangkat secara realtime.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
               <Icons.spinner className="h-8 w-8 animate-spin mb-4" />
               <p>Memuat data riwayat aktivitas...</p>
             </div>
          ) : noDevice ? (
             <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
               <p className="text-muted-foreground">Anda belum menghubungkan Device ID.</p>
               <Button asChild>
                 <Link href="/dashboard/profile">Hubungkan Perangkat Sekarang</Link>
               </Button>
             </div>
          ) : (
            <div className='border rounded-md'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu Kejadian</TableHead>
                    <TableHead>Jenis Insiden</TableHead>
                    <TableHead>Catatan / Sensor</TableHead>
                    <TableHead>Status Penanganan</TableHead>
                    <TableHead className='text-right'>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.date}</TableCell>
                      <TableCell className='font-medium'>
                        <span className={log.isDanger ? 'text-red-600 font-bold' : ''}>
                          {log.typeDisplay}
                        </span>
                      </TableCell>
                      <TableCell className='text-sm text-muted-foreground'>{log.notes}</TableCell>
                      <TableCell>
                        <Badge variant={log.handlingStatus?.toLowerCase() === 'open' ? 'destructive' : 'secondary'}>
                          {log.handlingStatus ? log.handlingStatus.toUpperCase() : 'UNKNOWN'}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right'>
                        {log.handlingStatus?.toLowerCase() === 'open' ? (
                          <Button variant='outline' size='sm' onClick={() => resolveLog(log.id)} className="border-green-200 hover:bg-green-50 hover:text-green-700">
                            <CheckCircle className='h-4 w-4 text-green-600 mr-2' />
                            Tangani
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground italic px-2">Diselesaikan</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className='text-center text-muted-foreground py-8'>
                        Belum ada riwayat aktivitas yang tercatat untuk perangkat Anda.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

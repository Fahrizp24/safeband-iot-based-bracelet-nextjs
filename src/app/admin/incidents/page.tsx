'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ambil semua incidents tanpa query khusus dulu untuk tes
    const unsub = onSnapshot(collection(db, 'incidents'), (snap) => {
      const incidentsData = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      
      // Sort manual di memory agar tidak butuh Index Firebase
      const sorted = incidentsData.sort((a: any, b: any) => {
        const timeA = new Date(a.rawTime || a.timestamp || 0).getTime();
        const timeB = new Date(b.rawTime || b.timestamp || 0).getTime();
        return timeB - timeA;
      });

      setIncidents(sorted);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Incident Error:", error);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className='p-6 space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Incident Reports</h1>
        <p className='text-muted-foreground'>Log global seluruh kejadian jatuh ({incidents.length} total).</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Semua Insiden</CardTitle>
          <CardDescription>Riwayat notifikasi bahaya dari semua user terdaftar.</CardDescription>
        </CardHeader>
        <CardContent className='p-0'>
          {loading ? (
            <div className='flex items-center justify-center p-12'>
              <Loader2 className='w-8 h-8 animate-spin text-primary' />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='px-6'>Waktu Kejadian</TableHead>
                  <TableHead className='px-6'>Pengguna / SN</TableHead>
                  <TableHead className='px-6'>Tipe</TableHead>
                  <TableHead className='px-6'>Status Tiket</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((inc) => (
                  <TableRow key={inc.id}>
                    <TableCell className='font-medium px-6'>
                      {(() => {
                        const t = inc.timestamp || inc.rawTime;
                        if (!t) return '-';
                        // Jika t adalah Firebase Timestamp (punya seconds)
                        if (t.seconds) {
                          return new Date(t.seconds * 1000).toLocaleString('id-ID');
                        }
                        // Jika t adalah string ISO atau lainnya
                        return new Date(t).toLocaleString('id-ID');
                      })()}
                    </TableCell>
                    <TableCell className='px-6'>
                      <div className='flex flex-col'>
                        <span className='font-semibold'>{inc.userId || 'Unknown'}</span>
                        <span className='text-xs text-muted-foreground'>{inc.deviceSn}</span>
                      </div>
                    </TableCell>
                    <TableCell className='px-6'>
                      <Badge variant='outline'>{inc.type || 'FALL'}</Badge>
                    </TableCell>
                    <TableCell className='px-6'>
                      <Badge variant={inc.status === 'open' ? 'destructive' : 'secondary'}>
                        {inc.status?.toUpperCase() || 'RESOLVED'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

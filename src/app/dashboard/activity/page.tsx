'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { db } from '@/lib/firebase';
import { onSnapshot, doc } from 'firebase/firestore';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ActivityLogsPage() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [noDevice, setNoDevice] = useState(false);
  const [deviceSn, setDeviceSn] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // 1. Ambil Device SN dari Firebase
  useEffect(() => {
    if (!session?.user?.email) return;

    const userUnsub = onSnapshot(doc(db, "users", session.user.email), (docSnap) => {
      if (docSnap.exists()) {
        const sn = docSnap.data().deviceSn;
        if (!sn) {
          setNoDevice(true);
          setLoading(false);
          setDeviceSn(null);
        } else {
          setNoDevice(false);
          setDeviceSn(sn);
        }
      } else {
        setLoading(false);
      }
    });

    return () => userUnsub();
  }, [session]);

  // 2. Fetch data dari Hadoop berdasarkan Device SN
  const fetchHadoopData = async (sn: string) => {
    try {
      const res = await fetch(`/api/hadoop/incidents?deviceId=${sn}`);
      const json = await res.json();
      
      if (json.success) {
        const mappedLogs = json.data.map((data: any) => {
          let dateStr = 'Unknown';
          if (data.timestamp) {
             const t = new Date(data.timestamp);
             dateStr = isNaN(t.getTime()) ? data.timestamp : t.toLocaleString('id-ID');
          }

          let locStr = '';
          if (data.lat && data.lng) {
             locStr = `Lokasi: ${data.lat}, ${data.lng}`;
          }
          if (data.accelerometerForce) {
             locStr = locStr ? `G-Force: ${data.accelerometerForce}G | ${locStr}` : `G-Force: ${data.accelerometerForce}G`;
          }

          const isDanger = data.type?.toUpperCase().includes('FALL') || data.type?.toUpperCase().includes('JATUH');

          return {
            id: data.id,
            ...data,
            date: dateStr,
            typeDisplay: data.type || 'Insiden Baru',
            notes: locStr || '-',
            isDanger: isDanger,
            handlingStatus: data.status || 'resolved',
          };
        });
        setLogs(mappedLogs);
        
        // Reset to page 1 if data is completely empty, otherwise try to stay on current page
        if (mappedLogs.length === 0) setCurrentPage(1);

      } else {
        console.error("Error API:", json.error);
      }
    } catch (error) {
      console.error("Gagal fetch data hadoop", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Auto Refresh setiap 10 Detik jika deviceSn sudah ada
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

  // Hitung data untuk pagination
  const totalPages = Math.ceil(logs.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLogs = logs.slice(startIndex, startIndex + pageSize);

  // Pastikan current page tidak melebihi batas saat pageSize berubah
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [pageSize, totalPages, currentPage]);

  return (
    <div className='p-6 space-y-6'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold'>Activity Logs</h1>
          <p className='text-muted-foreground'>Riwayat kejadian dan log aktivitas SafeBand Anda.</p>
        </div>
        {deviceSn && (
            <Button onClick={() => fetchHadoopData(deviceSn)} disabled={loading} variant="outline" size="sm">
                <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
            </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Aktivitas (Hadoop)</CardTitle>
          <CardDescription>Menampilkan log insiden dari Big Data Server khusus untuk Device ID: <strong>{deviceSn}</strong></CardDescription>
        </CardHeader>
        <CardContent>
          {loading && logs.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
               <Icons.spinner className="h-8 w-8 animate-spin mb-4" />
               <p>Memuat data riwayat aktivitas dari Hadoop...</p>
             </div>
          ) : noDevice ? (
             <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
               <p className="text-muted-foreground">Anda belum menghubungkan Device ID di akun Anda.</p>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.date}</TableCell>
                      <TableCell className='font-medium'>
                        {/* Jika badge isDanger tetap hijau karena tema, ini akan memaksa warna merah (bg-red-500) */}
                        <Badge 
                          variant={log.isDanger ? 'destructive' : 'outline'}
                          className={log.isDanger ? 'bg-red-500 hover:bg-red-600 text-white border-transparent font-bold' : ''}
                        >
                          {log.typeDisplay}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-sm text-muted-foreground'>{log.notes}</TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            log.handlingStatus?.toUpperCase() === 'JATUH' || log.handlingStatus?.toUpperCase() === 'ACTIVE'
                              ? 'bg-red-500 hover:bg-red-600 text-white border-transparent font-bold'
                              : log.handlingStatus?.toUpperCase() === 'WASPADA'
                              ? 'bg-orange-500 hover:bg-orange-600 text-white border-transparent font-bold'
                              : 'bg-green-500 hover:bg-green-600 text-white border-transparent font-bold'
                          }
                        >
                          {log.handlingStatus ? log.handlingStatus.toUpperCase() : 'UNKNOWN'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className='text-center text-muted-foreground py-8'>
                        Belum ada riwayat aktivitas yang tercatat untuk perangkat {deviceSn}.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        {/* Pagination Controls */}
        {!noDevice && logs.length > 0 && (
          <CardFooter className="flex items-center justify-between px-6 py-4 border-t">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <p>Tampilkan</p>
              <Select
                value={pageSize.toString()}
                onValueChange={(val) => {
                  setPageSize(Number(val));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={pageSize.toString()} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[20, 50, 100].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p>baris per halaman</p>
            </div>

            <div className="flex items-center space-x-6 lg:space-x-8">
              <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                Halaman {currentPage} dari {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                >
                  <span className="sr-only">Halaman sebelumnya</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                >
                  <span className="sr-only">Halaman selanjutnya</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

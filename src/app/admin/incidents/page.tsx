'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHadoopData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hadoop/incidents');
      const json = await res.json();
      if (json.success) {
        // === REVISI FAJRUL: FILTER DATA AGAR HANYA MENAMPILKAN PER 1 MENIT ===
        const waktuSekarang = Date.now();
        const dataTerfilter = json.data.filter((inc: any) => {
          const waktuInsiden = new Date(inc.timestamp).getTime();
          // Hanya lolos filter jika jarak waktu insiden dengan sekarang <= 1 menit (60.000 ms)
          return !isNaN(waktuInsiden) && (waktuSekarang - waktuInsiden <= 60000);
        });

        setIncidents(dataTerfilter);
      } else {
        console.error("Error API:", json.error);
      }
    } catch (error) {
      console.error("Gagal fetch data hadoop", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHadoopData();
    
    // Auto-refresh data tiap 10 detik agar tetap up to date
    const interval = setInterval(fetchHadoopData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className='p-6 space-y-6'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold'>Incident Reports (Hadoop)</h1>
          <p className='text-muted-foreground'>Log kejadian dari HDFS dalam 1 menit terakhir ({incidents.length} terdeteksi).</p>
        </div>
        <Button onClick={fetchHadoopData} disabled={loading} variant="outline" size="sm">
            <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Semua Insiden</CardTitle>
          <CardDescription>Riwayat notifikasi dari cluster Hadoop Dataproc (Filter: 1 Menit Terakhir).</CardDescription>
        </CardHeader>
        <CardContent className='p-0'>
          {loading && incidents.length === 0 ? (
            <div className='flex items-center justify-center p-12'>
              <Loader2 className='w-8 h-8 animate-spin text-primary' />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='px-6'>Waktu Kejadian</TableHead>
                  <TableHead className='px-6'>Device SN</TableHead>
                  <TableHead className='px-6'>Tipe & Acc Force</TableHead>
                  {/* REVISI FAJRUL: Kolom "Status" (TableHead) sudah dihapus dari sini */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.length > 0 ? (
                  incidents.map((inc) => (
                    <TableRow key={inc.id}>
                      <TableCell className='font-medium px-6'>
                        {(() => {
                          const t = new Date(inc.timestamp);
                          return isNaN(t.getTime()) ? inc.timestamp : t.toLocaleString('id-ID');
                        })()}
                      </TableCell>
                      <TableCell className='px-6 font-semibold'>
                        {inc.deviceSn || 'Unknown'}
                      </TableCell>
                      <TableCell className='px-6'>
                        <div className='flex flex-col gap-1 items-start'>
                          <Badge variant={inc.type?.toUpperCase().includes('FALL') || inc.type?.toUpperCase().includes('JATUH') ? 'destructive' : 'outline'}>
                            {inc.type || 'UNKNOWN'}
                          </Badge>
                          <span className='text-xs text-muted-foreground'>
                            Acc: {inc.accelerometerForce ? `${inc.accelerometerForce} G` : '-'}
                          </span>
                        </div>
                      </TableCell>
                      {/* REVISI FAJRUL: Kolom isi data Status (TableCell Badge) sudah dihapus total */}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      Tidak ada insiden baru dalam 1 menit terakhir di Hadoop.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
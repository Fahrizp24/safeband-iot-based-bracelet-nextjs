'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCcw, ChevronLeft, ChevronRight, Activity, HeartPulse, Database, MapPin } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { db } from '@/lib/firebase';
import { onSnapshot, doc } from 'firebase/firestore';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// =======================================================
// KOMPONEN PINTAR UNTUK KONVERSI KECAMATAN & KOTA
// =======================================================
function LocationCell({ lat, lng }: { lat: string; lng: string }) {
  const [locationName, setLocationName] = useState<string>('Mencari...');

  useEffect(() => {
    if (!lat || !lng || parseFloat(lat) === 0) {
      setLocationName('Sinyal GPS Hilang');
      return;
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

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

// =======================================================
// HALAMAN UTAMA ACTIVITY LOGS (RESPONSIVE VIEW)
// =======================================================
export default function ActivityLogsPage() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [noDevice, setNoDevice] = useState(false);
  const [deviceSn, setDeviceSn] = useState<string | null>(null);

  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Mendeteksi...');
  const [systemHealth, setSystemHealth] = useState({ status: 'Menganalisis...', desc: 'Memproses data log...', variant: 'text-blue-600 bg-blue-50' });

  // State Manajemen Tabel & Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // State Filter & Sort
  const [filterType, setFilterType] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('NEWEST');

  const getForceStatus = (forceStr: string) => {
    const force = parseFloat(forceStr);
    if (isNaN(force) || forceStr === '' || force === 0) {
      return { label: 'Data Loss', style: 'bg-slate-50 text-slate-500 border-slate-200' };
    }
    if (force > 2.5) {
      return { label: 'Benturan Tinggi', style: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold' };
    }
    if (force > 1.5) {
      return { label: 'Guncangan', style: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    return { label: 'Aman', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

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

          return {
            id: data.id,
            ...data,
            date: dateStr,
          };
        });
        setLogs(mappedLogs);
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

  useEffect(() => {
    if (logs.length > 0) {
      const latestLog = logs[0];
      const latestTime = latestLog.timestamp ? new Date(latestLog.timestamp).getTime() : 0;
      
      const evaluateRealtimeStatus = () => {
        const now = new Date().getTime();
        const diffInSeconds = Math.floor((now - latestTime) / 1000);

        if (diffInSeconds <= 60 && diffInSeconds >= 0) {
          setIsRealtimeConnected(true);
          setStatusMessage('Aktif Saat Ini');
        } else {
          setIsRealtimeConnected(false);
          if (isNaN(diffInSeconds) || diffInSeconds < 0) {
            setStatusMessage('Offline');
          } else if (diffInSeconds < 3600) {
            setStatusMessage(`Terputus (${Math.floor(diffInSeconds / 60)} mnt lalu)`);
          } else {
            setStatusMessage('Terputus / Pasif');
          }
        }
      };

      evaluateRealtimeStatus();
      const statusTimer = setInterval(evaluateRealtimeStatus, 5000);

      const latVal = parseFloat(latestLog.lat);
      const lngVal = parseFloat(latestLog.lng);
      const forceVal = parseFloat(latestLog.accelerometerForce);

      const isGpsLoss = !latestLog.lat || !latestLog.lng || latVal === 0 || lngVal === 0;
      const isMpuLoss = latestLog.accelerometerForce === undefined || latestLog.accelerometerForce === null || latestLog.accelerometerForce === '' || forceVal === 0;

      if (isGpsLoss && isMpuLoss) {
        setSystemHealth({ status: 'Kritis', desc: 'Data Loss total: MPU & GPS terputus!', variant: 'text-rose-600 bg-rose-50 border-rose-200' });
      } else if (isMpuLoss) {
        setSystemHealth({ status: 'Sensor Error', desc: 'Sensor MPU gagal deteksi tekanan', variant: 'text-amber-600 bg-amber-50 border-amber-200' });
      } else if (isGpsLoss) {
        setSystemHealth({ status: 'GPS Lost', desc: 'Sinyal satelit koordinat hilang', variant: 'text-amber-600 bg-amber-50 border-amber-200' });
      } else {
        setSystemHealth({ status: 'Normal', desc: 'Semua streaming data berjalan sehat', variant: 'text-emerald-600 bg-emerald-50 border-emerald-200' });
      }

      return () => clearInterval(statusTimer);
    } else {
      setIsRealtimeConnected(false);
      setStatusMessage('Menunggu Perangkat...');
      setSystemHealth({ status: 'No Data', desc: 'Belum ada data masuk dari HDFS', variant: 'text-slate-400 bg-slate-50 border-slate-200' });
    }
  }, [logs]);

  // =======================================================
  // PIPELINE PEMROSESAN DATA (FILTERING & SORTING)
  // =======================================================
  const processedLogs = (() => {
    let result = logs.filter((log) => {
      if (filterType === 'ALL') return true;
      return log.type?.toUpperCase() === filterType.toUpperCase();
    });

    return result.sort((a, b) => {
      if (sortBy === 'NEWEST') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      if (sortBy === 'OLDEST') {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
      if (sortBy === 'FORCE_HIGHEST') {
        const forceA = parseFloat(a.accelerometerForce) || 0;
        const forceB = parseFloat(b.accelerometerForce) || 0;
        return forceB - forceA;
      }
      return 0;
    });
  })();

  const totalPages = Math.ceil(processedLogs.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLogs = processedLogs.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [pageSize, totalPages, currentPage]);

  return (
    <div className='w-full p-4 md:p-6 space-y-5'>
      {/* Header Halaman */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-slate-100'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight text-slate-900'>Activity Logs</h1>
          <p className='text-xs text-muted-foreground'>Riwayat kejadian dan log aktivitas SafeBand Anda secara realtime.</p>
        </div>
        {deviceSn && (
            <Button onClick={() => fetchHadoopData(deviceSn)} disabled={loading} variant="outline" size="sm" className="h-8 shadow-sm text-xs w-full sm:w-auto">
                <RefreshCcw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
            </Button>
        )}
      </div>

      {/* Ringkasan Informasi / Stat Cards */}
      {!noDevice && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3 w-full">
          <Card className="bg-card shadow-sm border border-slate-200/60 rounded-xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Status Perangkat</p>
                <h3 className={`text-xl font-bold transition-colors ${isRealtimeConnected ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {isRealtimeConnected ? 'Terhubung' : 'Terputus'}
                </h3>
                <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${isRealtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'}`}></span>
                  {statusMessage}
                </p>
              </div>
              <div className={`p-2.5 rounded-lg transition-colors ${isRealtimeConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                <Activity className={`h-4 w-4 ${isRealtimeConnected ? 'animate-pulse' : ''}`} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-sm border border-slate-200/60 rounded-xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Sistem Health</p>
                <h3 className={`text-xl font-bold ${systemHealth.variant.split(' ')[0]}`}>{systemHealth.status}</h3>
                <p className="text-[11px] text-muted-foreground truncate max-w-[220px]" title={systemHealth.desc}>{systemHealth.desc}</p>
              </div>
              <div className={`p-2.5 rounded-lg ${systemHealth.variant.split(' ')[1]} ${systemHealth.variant.split(' ')[0]}`}>
                <HeartPulse className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-sm border border-slate-200/60 rounded-xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total Log Masuk</p>
                <h3 className="text-xl font-bold text-slate-800">{processedLogs.length} <span className="text-xs text-muted-foreground font-normal">/ {logs.length} total</span></h3>
                <p className="text-[11px] text-muted-foreground">Komparasi Repositori HDFS Hadoop</p>
              </div>
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
                <Database className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* REPOSITORI REFRESHED CONTAINER */}
      <Card className="w-full border shadow-sm bg-card rounded-xl overflow-hidden">
        {/* MERGED HEADER & CONTROL PANEL */}
        <CardHeader className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-semibold text-slate-900">Riwayat Aktivitas (Hadoop Cluster)</CardTitle>
            <CardDescription className="text-xs">
              ID Perangkat: <strong className="font-mono bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-800 text-[11px]">{deviceSn || 'Memuat...'}</strong>
            </CardDescription>
          </div>
          
          {/* Dropdown Filters Terintegrasi di Kanan Header */}
          {!noDevice && logs.length > 0 && (
            <div className="flex flex-row items-center gap-3 self-end sm:self-auto">
              {/* Filter Insiden */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground hidden lg:inline">Filter:</span>
                <Select
                  value={filterType}
                  onValueChange={(val) => {
                    setFilterType(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[120px] text-xs bg-white border-slate-200 shadow-sm">
                    <SelectValue placeholder="Semua Log" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="text-xs">Semua Log</SelectItem>
                    <SelectItem value="JATUH" className="text-xs">JATUH</SelectItem>
                    <SelectItem value="WASPADA" className="text-xs">WASPADA</SelectItem>
                    <SelectItem value="NORMAL" className="text-xs">NORMAL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sorting Data */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground hidden lg:inline">Urutan:</span>
                <Select
                  value={sortBy}
                  onValueChange={(val) => {
                    setSortBy(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[140px] text-xs bg-white border-slate-200 shadow-sm">
                    <SelectValue placeholder="Waktu Terbaru" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEWEST" className="text-xs">Waktu Terbaru</SelectItem>
                    <SelectItem value="OLDEST" className="text-xs">Waktu Terlama</SelectItem>
                    <SelectItem value="FORCE_HIGHEST" className="text-xs">Tekanan Tertinggi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="p-0">
          {loading && logs.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
               <Icons.spinner className="h-6 w-6 animate-spin mb-3" />
               <p className="text-xs">Mendeteksi repositori logs.csv pada HDFS Server...</p>
             </div>
          ) : noDevice ? (
             <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
               <p className="text-xs text-muted-foreground">Anda belum menghubungkan Device ID di akun Anda.</p>
               <Button asChild size="sm" className="h-8 text-xs">
                 <Link href="/dashboard/profile">Hubungkan Perangkat Sekarang</Link>
               </Button>
             </div>
          ) : (
            <>
              {/* LAYOUT A: DESKTOP TABLE VIEW */}
              <div className='hidden md:block w-full overflow-x-auto'>
                <Table>
                  <TableHeader className="bg-slate-50/40 sticky top-0 border-b border-slate-100">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[20%] h-9 text-xs font-semibold text-slate-600 px-4">Waktu Kejadian</TableHead>
                      <TableHead className="w-[18%] h-9 text-xs font-semibold text-slate-600 px-4">Jenis Insiden</TableHead>
                      <TableHead className="w-[25%] h-9 text-xs font-semibold text-slate-600 px-4">Kondisi Tekanan</TableHead>
                      <TableHead className="w-[37%] h-9 text-xs font-semibold text-slate-600 px-4">Lokasi (Kecamatan, Kota)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLogs.map((log) => {
                      const forceStatus = getForceStatus(log.accelerometerForce);
                      return (
                        <TableRow key={log.id} className="hover:bg-slate-50/40 transition-colors border-b border-slate-100/70">
                          <TableCell className="font-mono text-xs text-slate-600 py-2.5 px-4 align-middle">{log.date}</TableCell>
                          <TableCell className="py-2.5 px-4 align-middle">
                            <Badge 
                              variant="outline"
                              className={
                                log.type?.toUpperCase() === 'JATUH'
                                  ? 'bg-red-50 text-red-700 border-red-200 font-bold px-2.5 py-0.5 text-[11px] rounded-full shadow-sm'
                                  : log.type?.toUpperCase() === 'WASPADA'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 font-bold px-2.5 py-0.5 text-[11px] rounded-full shadow-sm'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-2.5 py-0.5 text-[11px] rounded-full shadow-sm'
                              }
                            >
                               {log.type ? log.type.toUpperCase() : 'NORMAL'}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2.5 px-4 align-middle">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${forceStatus.style}`}>
                                {forceStatus.label}
                              </Badge>
                              {log.accelerometerForce && parseFloat(log.accelerometerForce) !== 0 && (
                                <span className="text-[10px] text-slate-400 font-mono tracking-tight">
                                  ({log.accelerometerForce} G)
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5 px-4 align-middle">
                            <LocationCell lat={log.lat} lng={log.lng} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* LAYOUT B: MOBILE ULTRA-COMPACT LIST VIEW */}
              <div className="block md:hidden divide-y divide-slate-100 bg-white">
                {paginatedLogs.map((log) => {
                  const forceStatus = getForceStatus(log.accelerometerForce);
                  return (
                    <div key={log.id} className="p-3 flex flex-col gap-1.5 hover:bg-slate-50/40 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-medium text-slate-500">
                          {log.date}
                        </span>
                        <Badge 
                          variant="outline"
                          className={
                            log.type?.toUpperCase() === 'JATUH'
                              ? 'bg-red-50 text-red-700 border-red-100 font-semibold px-2.5 py-0.5 text-[10px] rounded-full shadow-sm'
                              : log.type?.toUpperCase() === 'WASPADA'
                              ? 'bg-amber-50 text-amber-700 border-amber-100 font-semibold px-2.5 py-0.5 text-[10px] rounded-full shadow-sm'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-100 font-semibold px-2.5 py-0.5 text-[10px] rounded-full shadow-sm'
                          }
                        >
                           {log.type ? log.type.toUpperCase() : 'NORMAL'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge variant="outline" className={`text-[10px] px-2 py-0.5 rounded-full font-normal ${forceStatus.style}`}>
                            {forceStatus.label}
                          </Badge>
                          {log.accelerometerForce && parseFloat(log.accelerometerForce) !== 0 && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {parseFloat(log.accelerometerForce).toFixed(3)}G
                            </span>
                          )}
                        </div>
                        <LocationCell lat={log.lat} lng={log.lng} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Fallback Jika Kosong */}
              {paginatedLogs.length === 0 && (
                <div className='text-center text-muted-foreground/80 py-12 text-xs'>
                  Tidak ada data log yang cocok dengan filter atau kriteria pencarian Anda saat ini.
                </div>
              )}
            </>
          )}
        </CardContent>
        
        {/* Pagination Controls */}
        {!noDevice && processedLogs.length > 0 && (
          <CardFooter className="flex flex-col sm:flex-row gap-3 sm:gap-0 items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/30">
            <div className="flex items-center space-x-1.5 text-xs text-muted-foreground order-2 sm:order-1">
              <p>Tampilkan</p>
              <Select
                value={pageSize.toString()}
                onValueChange={(val) => {
                  setPageSize(Number(val));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-7 w-[65px] text-xs bg-white border-slate-200">
                  <SelectValue placeholder={pageSize.toString()} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[20, 50, 100].map((size) => (
                    <SelectItem key={size} value={size.toString()} className="text-xs">
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p>baris</p>
            </div>

            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-4 order-1 sm:order-2">
              <div className="text-xs font-medium text-slate-600">
                Halaman {currentPage} dari {totalPages}
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  className="h-7 w-7 p-0 shadow-sm bg-white border-slate-200"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  className="h-7 w-7 p-0 shadow-sm bg-white border-slate-200"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
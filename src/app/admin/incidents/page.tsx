// src/app/admin/incidents/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCcw, ChevronLeft, ChevronRight, Activity, ShieldAlert, 
  Database, MapPin, Calendar, Layers, Cpu, Clock, BarChart3, LineChart as LineIcon
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Import Recharts untuk visualisasi data analitik admin
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';

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

    // Deteksi Lokal Khusus Area Sekitar POLINEMA / Lowokwaru
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
      href={`https://www.google.com/maps?q=${lat},${lng}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium bg-blue-50/60 hover:bg-blue-100/70 px-2.5 py-0.5 rounded-full border border-blue-100/50 transition-all"
    >
      <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
      <span className="truncate max-w-[140px]">{locationName}</span>
    </a>
  );
}

// =======================================================
// HALAMAN UTAMA INCIDENT REPORT (ADMIN CORE VIEW)
// =======================================================
export default function AdminIncidentsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  // State Manajemen Tabel & Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // State Filter & Sort
  const [filterType, setFilterType] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('NEWEST');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // State Ringkasan Admin
  const [uniqueDevicesCount, setUniqueDevicesCount] = useState(0);
  const [todayIncidentsCount, setTodayIncidentsCount] = useState(0);

  const getForceStatus = (forceStr: string) => {
    const force = parseFloat(forceStr);
    if (isNaN(force) || forceStr === '' || force === 0) {
      return { label: 'Data Loss', style: 'bg-slate-50 text-slate-500 border-slate-200' };
    }
    if (force > 1.2) {
      return { label: 'Benturan Tinggi', style: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold' };
    }
    if (force > 0.9) {
      return { label: 'Guncangan', style: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    return { label: 'Aman', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  const fetchAdminFirestoreData = async () => {
    try {
      const res = await fetch('/api/firebase/incidents');
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
        calculateAdminStats(mappedLogs);
        if (mappedLogs.length === 0) setCurrentPage(1);
      } else {
        console.error("Error API Firestore Admin:", json.error);
      }
    } catch (error) {
      console.error("Gagal fetch data Firestore", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAdminStats = (allLogs: any[]) => {
    const devices = new Set(allLogs.map(log => log.deviceSn).filter(sn => sn && sn !== 'Unknown'));
    setUniqueDevicesCount(devices.size);

    const todayStr = new Date().toDateString();
    const todayLogs = allLogs.filter(log => {
      if (!log.timestamp) return false;
      return new Date(log.timestamp).toDateString() === todayStr;
    });
    setTodayIncidentsCount(todayLogs.length);
  };

  useEffect(() => {
    setMounted(true);
    setLoading(true);
    fetchAdminFirestoreData();
    
    const interval = setInterval(fetchAdminFirestoreData, 10000);
    return () => clearInterval(interval);
  }, []);

  const resetDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // =======================================================
  // PIPELINE AGREGASI PERANGKAT (DISTINCT DEVICE CARDS)
  // =======================================================
  const deviceSummaryList = (() => {
    const map = new Map<string, any>();
    
    logs.forEach((log) => {
      const sn = log.deviceSn || 'Unknown';
      if (sn === 'Unknown') return;

      if (!map.has(sn)) {
        map.set(sn, {
          deviceSn: sn,
          totalIncidents: 0,
          latestType: log.type || 'JATUH',
          latestDate: log.date,
          latitude: log.latitude,
          longitude: log.longitude,
          accelerometerForce: log.accelerometerForce,
        });
      }
      map.get(sn).totalIncidents += 1;
    });

    return Array.from(map.values());
  })();

  // =======================================================
  // PIPELINE AGREGASI DATA GRAFIK (CHARTS DATA ENGINE)
  // =======================================================
  
  // 1. Grafik Banyak Jatuh Per Tanggal
  const chartFallsByDate = (() => {
    const dateMap = new Map<string, { sortingKey: string; displayDate: string; count: number }>();
    
    logs.forEach(log => {
      if (log.type?.toUpperCase() === 'JATUH' && log.timestamp) {
        const d = new Date(log.timestamp);
        if (!isNaN(d.getTime())) {
          const sortingKey = d.toISOString().split('T')[0]; // YYYY-MM-DD
          const displayDate = d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
          
          if (!dateMap.has(sortingKey)) {
            dateMap.set(sortingKey, { sortingKey, displayDate, count: 0 });
          }
          dateMap.get(sortingKey)!.count += 1;
        }
      }
    });

    return Array.from(dateMap.values())
      .sort((a, b) => a.sortingKey.localeCompare(b.sortingKey))
      .map(item => ({
        Tanggal: item.displayDate,
        'Jumlah Jatuh': item.count
      }));
  })();

  // 2. Grafik Banyak Jatuh Per Kecamatan (Mapping Koordinat Malang)
  const chartFallsByKecamatan = (() => {
    const kecMap = new Map<string, number>();

    const getKecamatanStatic = (latStr: string, lngStr: string) => {
      if (!latStr || !lngStr) return 'Sinyal Hilang';
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      if (isNaN(lat) || isNaN(lng) || lat === 0) return 'Sinyal Hilang';

      // Pencocokan batas wilayah makro area Malang Raya demi performa chart eksekusi instan
      if (lat <= -7.94 && lat >= -7.96 && lng >= 112.60 && lng <= 112.62) return 'Lowokwaru';
      if (lat < -7.96 && lat >= -7.99 && lng >= 112.60 && lng <= 112.63) return 'Klojen';
      if (lat <= -7.91 && lat > -7.94 && lng >= 112.62 && lng <= 112.66) return 'Blimbing';
      if (lat < -7.98 && lng >= 112.57 && lng <= 112.62) return 'Sukun';
      if (lat < -7.96 && lng > 112.63) return 'Kedungkandang';
      
      return 'Luar Area';
    };

    logs.forEach(log => {
      if (log.type?.toUpperCase() === 'JATUH') {
        const kecamatan = getKecamatanStatic(log.latitude, log.longitude);
        kecMap.set(kecamatan, (kecMap.get(kecamatan) || 0) + 1);
      }
    });

    return Array.from(kecMap.entries())
      .map(([name, count]) => ({
        Kecamatan: name,
        'Kasus Jatuh': count
      }))
      .sort((a, b) => b['Kasus Jatuh'] - a['Kasus Jatuh']);
  })();

  // =======================================================
  // PIPELINE PEMROSESAN DATA TABEL (FILTERING & SORTING)
  // =======================================================
  const processedLogs = (() => {
    let result = logs.filter((log) => {
      if (filterType !== 'ALL' && log.type?.toUpperCase() !== filterType.toUpperCase()) {
        return false;
      }

      if (log.timestamp) {
        const logDate = new Date(log.timestamp);
        
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (logDate < start) return false;
        }
        
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (logDate > end) return false;
        }
      }

      return true;
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
    <div className='w-full p-4 md:p-6 space-y-6'>
      {/* Header Halaman */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-slate-100'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight text-slate-900'>Global Incident Reports</h1>
          <p className='text-xs text-muted-foreground'>Pusat kendali monitoring dan log darurat seluruh perangkat IoT aktif (Firestore Database).</p>
        </div>
        <Button onClick={fetchAdminFirestoreData} disabled={loading} variant="outline" size="sm" className="h-8 shadow-sm text-xs w-full sm:w-auto">
            <RefreshCcw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Firestore
        </Button>
      </div>

      {/* NEW SECTION: VISUAL ANALYTICS PANEL (GRAFIK TREN & WILAYAH) */}
      {mounted && logs.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grafik 1: Tren Banyak Jatuh Per Tanggal */}
          <Card className="border shadow-sm rounded-xl overflow-hidden bg-white">
            <CardHeader className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-row items-center gap-3">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                <LineIcon className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-slate-800">Tren Kasus Jatuh per Tanggal</CardTitle>
                <CardDescription className="text-[11px]">Metrik fluktuasi sinyal darurat JATUH yang masuk ke cloud server.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-6 h-[260px] text-xs">
              {chartFallsByDate.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground italic">
                  Belum ada log dengan kategori insiden JATUH untuk dipetakan.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartFallsByDate} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorFalls" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="Tanggal" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                    />
                    <Area type="monotone" dataKey="Jumlah Jatuh" stroke="#e11d48" strokeWidth={2} fillOpacity={1} fill="url(#colorFalls)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Grafik 2: Sebaran Jatuh Per Kecamatan */}
          <Card className="border shadow-sm rounded-xl overflow-hidden bg-white">
            <CardHeader className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-row items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-slate-800">Distribusi Kasus per Kecamatan</CardTitle>
                <CardDescription className="text-[11px]">Peta kerawanan zona insiden jatuh berdasarkan koordinat GPS hardware.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-6 h-[260px] text-xs">
              {chartFallsByKecamatan.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground italic">
                  Belum ada data geolokasi insiden JATUH untuk dikelompokkan.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartFallsByKecamatan} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="Kecamatan" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                    />
                    <Bar dataKey="Kasus Jatuh" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={35} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* SECTION 3: MAIN DATA CONTAINER (LOG TABLE & CONTROLS) */}
      <Card className="w-full border shadow-sm bg-card rounded-xl overflow-hidden">
        <CardHeader className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-semibold text-slate-900">Log Riwayat Darurat Global</CardTitle>
            <CardDescription className="text-xs">Total Data Terfilter: {processedLogs.length} baris</CardDescription>
          </div>
          
          {/* Filters & Control Panel */}
          {logs.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full xl:w-auto justify-end">
              
              {/* Range Tanggal Picker */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-sm h-8">
                <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                  <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Periode:</span>
                </div>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="text-xs font-medium text-slate-700 bg-transparent outline-none focus:ring-0 cursor-pointer border-0 p-0 w-[110px]"
                />
                <span className="text-xs text-slate-400 font-medium px-0.5">s/d</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="text-xs font-medium text-slate-700 bg-transparent outline-none focus:ring-0 cursor-pointer border-0 p-0 w-[110px]"
                />
                {(startDate || endDate) && (
                  <button 
                    onClick={resetDateFilter}
                    className="text-[10px] text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-1.5 py-0.5 rounded font-medium transition-colors ml-1"
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="flex flex-row items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                {/* Dropdown Filter Insiden */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground hidden lg:inline">Filter:</span>
                  <Select
                    value={filterType}
                    onValueChange={(val) => {
                      setFilterType(val);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[115px] text-xs bg-white border-slate-200 shadow-sm">
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

                {/* Dropdown Sorting */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground hidden lg:inline">Urutan:</span>
                  <Select
                    value={sortBy}
                    onValueChange={(val) => {
                      setSortBy(val);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[130px] text-xs bg-white border-slate-200 shadow-sm">
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

            </div>
          )}
        </CardHeader>
        
        <CardContent className="p-0">
          {loading && logs.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
               <Loader2 className="h-6 w-6 animate-spin text-primary mb-3" />
               <p className="text-xs">Menghubungkan & mendata ulang log dari Firestore Cloud...</p>
             </div>
          ) : (
            <>
              {/* VIEW A: DESKTOP TABLE VIEW */}
              <div className='hidden md:block w-full overflow-x-auto'>
                <Table>
                  <TableHeader className="bg-slate-50/40 sticky top-0 border-b border-slate-100">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[18%] h-9 text-xs font-semibold text-slate-600 px-4">Waktu Kejadian</TableHead>
                      <TableHead className="w-[15%] h-9 text-xs font-semibold text-slate-600 px-4">Device SN</TableHead>
                      <TableHead className="w-[15%] h-9 text-xs font-semibold text-slate-600 px-4">Jenis Insiden</TableHead>
                      <TableHead className="w-[22%] h-9 text-xs font-semibold text-slate-600 px-4">Metrik Sensor Hardware</TableHead>
                      <TableHead className="w-[30%] h-9 text-xs font-semibold text-slate-600 px-4">Lokasi Korban</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLogs.map((log) => {
                      const forceStatus = getForceStatus(log.accelerometerForce);
                      return (
                        <TableRow key={log.id} className="hover:bg-slate-50/40 transition-colors border-b border-slate-100/70">
                          <TableCell className="font-mono text-xs text-slate-600 py-2.5 px-4 align-middle">{log.date}</TableCell>
                          <TableCell className="font-mono font-semibold text-xs text-primary py-2.5 px-4 align-middle">{log.deviceSn}</TableCell>
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
                               {log.type ? log.type.toUpperCase() : 'JATUH'}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2.5 px-4 align-middle">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5">
                                <Badge variant="outline" className={`text-[10px] px-2 py-0 rounded-full font-medium ${forceStatus.style}`}>
                                  {forceStatus.label}
                                </Badge>
                                {log.accelerometerForce && (
                                  <span className="text-[10px] text-slate-400 font-mono">({Number(log.accelerometerForce).toFixed(3)} G)</span>
                                )}
                              </div>
                              {log.tilt !== '' && (
                                <span className="text-[10px] text-muted-foreground font-medium mt-0.5 flex items-center gap-1">
                                  <Layers className="h-2.5 w-2.5 text-slate-400" /> Kemiringan: {Number(log.tilt).toFixed(1)}°
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5 px-4 align-middle">
                            <LocationCell lat={log.latitude} lng={log.longitude} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* VIEW B: MOBILE ULTRA-COMPACT LIST VIEW */}
              <div className="block md:hidden divide-y divide-slate-100 bg-white">
                {paginatedLogs.map((log) => {
                  const forceStatus = getForceStatus(log.accelerometerForce);
                  return (
                    <div key={log.id} className="p-3 flex flex-col gap-1.5 hover:bg-slate-50/40 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="font-mono text-[11px] font-medium text-slate-500">{log.date}</span>
                          <span className="font-mono text-[10px] font-bold text-primary">SN: {log.deviceSn}</span>
                        </div>
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
                           {log.type ? log.type.toUpperCase() : 'JATUH'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 rounded-full font-normal ${forceStatus.style}`}>
                              {forceStatus.label}
                            </Badge>
                            {log.accelerometerForce && (
                              <span className="text-[10px] text-slate-400 font-mono">{Number(log.accelerometerForce).toFixed(2)}G</span>
                            )}
                          </div>
                          {log.tilt !== '' && (
                            <span className="text-[9px] text-muted-foreground">Tilt: {Number(log.tilt).toFixed(1)}°</span>
                          )}
                        </div>
                        <LocationCell lat={log.latitude} lng={log.longitude} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Fallback View */}
              {processedLogs.length === 0 && (
                <div className='text-center text-muted-foreground/80 py-12 text-xs'>
                  Tidak ada record insiden yang cocok dengan pengaturan kriteria filter admin.
                </div>
              )}
            </>
          )}
        </CardContent>
        
        {/* Pagination Panel */}
        {processedLogs.length > 0 && (
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
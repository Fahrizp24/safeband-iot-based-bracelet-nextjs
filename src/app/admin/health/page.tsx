// src/app/admin/health/page.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, ServerCrash, Clock, Database, Radio } from 'lucide-react';

export default function SystemHealthPage() {
  // Simulasi data log dari Firestore (bisa di-connect ke state/realtime subscription nanti)
  const recentLogs = [
    { id: "1", device: "ESP32-004", status: "Normal", tilt: "88.34°", force: "1.03G", time: "10:33:23" },
    { id: "2", device: "ESP32-004", status: "Normal", tilt: "85.12°", force: "0.98G", time: "10:30:15" },
    { id: "3", device: "ESP32-001", status: "Warning", tilt: "45.21°", force: "2.14G", time: "10:28:00" },
  ];

  return (
    <div className='p-6 space-y-6'>
      {/* Header dengan Live Indicator */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>System Health</h1>
          <p className='text-muted-foreground text-sm'>Monitoring integrasi data dan server backend.</p>
        </div>
        <div className='flex items-center space-x-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-medium border border-green-200 animate-pulse'>
          <Radio className='w-3.5 h-3.5' />
          <span>Live Monitoring Active</span>
        </div>
      </div>

      {/* Metrik Utama - 4 Kolom di Layar Lebar */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {/* API Latency */}
        <Card className="shadow-sm">
          <CardHeader className='pb-2 flex flex-row items-center justify-between space-y-0'>
            <CardTitle className='text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center'>
              <Activity className='mr-2 w-4 h-4 text-emerald-500' /> API Latency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-emerald-600'>24ms</div>
            <p className='text-[11px] text-muted-foreground mt-1'>Rata-rata waktu respons server</p>
          </CardContent>
        </Card>
        
        {/* Database Load */}
        <Card className="shadow-sm">
          <CardHeader className='pb-2 flex flex-row items-center justify-between space-y-0'>
            <CardTitle className='text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center'>
              <Database className='mr-2 w-4 h-4 text-blue-500' /> Beban Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-slate-800'>12%</div>
            <p className='text-[11px] text-muted-foreground mt-1'>Kapasitas Firebase aman</p>
          </CardContent>
        </Card>
        
        {/* API Uptime */}
        <Card className="shadow-sm">
          <CardHeader className='pb-2 flex flex-row items-center justify-between space-y-0'>
            <CardTitle className='text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center'>
              <Clock className='mr-2 w-4 h-4 text-indigo-500' /> Uptime API
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-slate-800'>99.98%</div>
            <p className='text-[11px] text-muted-foreground mt-1'>Statistik 30 hari terakhir</p>
          </CardContent>
        </Card>

        {/* Error Log - Dinamis Berdasarkan Nilai */}
        <Card className="shadow-sm border-l-4 border-l-slate-200">
          <CardHeader className='pb-2 flex flex-row items-center justify-between space-y-0'>
            <CardTitle className='text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center'>
              <ServerCrash className='mr-2 w-4 h-4 text-slate-400' /> Error Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-slate-500'>0</div>
            <p className='text-[11px] text-muted-foreground mt-1'>Critical error (24 jam terakhir)</p>
          </CardContent>
        </Card>
      </div>

      {/* Bagian Bawah: Memanfaatkan Whitespace dengan Data Stream Terakhir */}
      <Card className="shadow-sm">
        <CardHeader>
          <h3 className="font-semibold text-base">Aliran Data IoT Terakhir (Firestore Stream)</h3>
          <p className="text-xs text-muted-foreground">Mendeteksi aktivitas sensor accelerometer dan tilt secara langsung dari perangkat band.</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                <tr>
                  <th className="px-4 py-3">Device SN</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Tilt</th>
                  <th className="px-4 py-3">Force</th>
                  <th className="px-4 py-3">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{log.device}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        log.status === 'Warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">{log.tilt}</td>
                    <td className="px-4 py-3 text-xs">{log.force}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{log.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
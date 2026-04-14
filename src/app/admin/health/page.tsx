import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, ServerCrash, Clock, Database } from 'lucide-react';

export default function SystemHealthPage() {
  return (
    <div className='p-6 space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>System Health</h1>
        <p className='text-muted-foreground'>Monitoring integrasi data dan server backend.</p>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center'><Activity className='mr-2 w-4 h-4' /> API Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>24ms</div>
            <p className='text-xs text-muted-foreground'>Rata-rata waktu respons server.</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center'><Database className='mr-2 w-4 h-4' /> Beban Database (Simulasi Firebase)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>12%</div>
            <p className='text-xs text-muted-foreground'>Kapasitas operasional aman.</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center'><Clock className='mr-2 w-4 h-4' /> Uptime API</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>99.98%</div>
            <p className='text-xs text-muted-foreground'>30 Hari Terakhir.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center'><ServerCrash className='mr-2 w-4 h-4 text-red-500' /> Error Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>0</div>
            <p className='text-xs text-muted-foreground'>Error critical dalam 24 jam terakhir.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

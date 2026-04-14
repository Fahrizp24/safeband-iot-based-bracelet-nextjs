import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, AppWindow, FileWarning } from 'lucide-react';

export default function AdminOverview() {
  return (
    <div className='p-6 space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Admin Dashboard</h1>
        <p className='text-muted-foreground'>Overview sistem global dan statistik terkini.</p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Total User Aktif</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>1,204</div>
            <p className='text-xs text-muted-foreground'>+12% dari bulan lalu</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Total Insiden Hari Ini</CardTitle>
            <FileWarning className='h-4 w-4 text-red-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600'>3</div>
            <p className='text-xs text-muted-foreground animate-pulse text-red-400'>1 sedang ditangani</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Perangkat Tersambung</CardTitle>
            <AppWindow className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>890</div>
            <p className='text-xs text-muted-foreground'>Unit ESP32-MPU6050</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Status Server</CardTitle>
            <Activity className='h-4 w-4 text-green-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>99.9%</div>
            <p className='text-xs text-muted-foreground'>Uptime (Bulan ini)</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Nanti bisa ditambahkan chart di sini */}
    </div>
  );
}

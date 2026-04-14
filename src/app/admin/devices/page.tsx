import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const devices = [
  { sn: 'ESP32-001', mac: '00:1B:44:11:3A:B7', status: 'Online', battery: '85%' },
  { sn: 'ESP32-002', mac: '00:1B:44:11:3A:B8', status: 'Offline', battery: '-' },
  { sn: 'ESP32-003', mac: '00:1B:44:11:3A:B9', status: 'Online', battery: '92%' },
];

export default function DeviceManagementPage() {
  return (
    <div className='p-6 space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Device Management</h1>
        <p className='text-muted-foreground'>Inventaris dan status unit IoT SafeBand.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Perangkat</CardTitle>
          <CardDescription>Semua unit ESP32 yang terhubung di sistem.</CardDescription>
        </CardHeader>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serial Number</TableHead>
                <TableHead>MAC Address</TableHead>
                <TableHead>Status API</TableHead>
                <TableHead>Baterai</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((d) => (
                <TableRow key={d.sn}>
                  <TableCell className='font-medium'>{d.sn}</TableCell>
                  <TableCell className='font-mono text-sm'>{d.mac}</TableCell>
                  <TableCell>
                    <Badge variant={d.status === 'Online' ? 'default' : 'secondary'}>{d.status}</Badge>
                  </TableCell>
                  <TableCell>{d.battery}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const incidents = [
  { id: 101, user: 'Budi Santoso', sn: 'ESP32-001', time: '10 April 2026 14:22', status: 'Resolved' },
  { id: 102, user: 'Budi Santoso', sn: 'ESP32-001', time: '09 April 2026 08:15', status: 'Resolved' },
  { id: 103, user: 'Supardi', sn: 'ESP32-008', time: '07 April 2026 19:40', status: 'Investigating' },
];

export default function IncidentsPage() {
  return (
    <div className='p-6 space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Incident Reports</h1>
        <p className='text-muted-foreground'>Log global seluruh kejadian jatuh untuk analisis (Big Data sederhana).</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Semua Insiden</CardTitle>
          <CardDescription>Riwayat notifikasi bahaya dari semua user terdaftar.</CardDescription>
        </CardHeader>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Pengguna</TableHead>
                <TableHead>Perangkat</TableHead>
                <TableHead>Waktu Kejadian</TableHead>
                <TableHead>Status Penanganan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((inc) => (
                <TableRow key={inc.id}>
                  <TableCell className='font-medium'>#{inc.id}</TableCell>
                  <TableCell>{inc.user}</TableCell>
                  <TableCell>{inc.sn}</TableCell>
                  <TableCell>{inc.time}</TableCell>
                  <TableCell>
                    <Badge variant={inc.status === 'Resolved' ? 'secondary' : 'destructive'}>{inc.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

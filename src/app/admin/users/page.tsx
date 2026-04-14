'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initialUsers = [
  { id: 1, name: 'Budi Santoso', email: 'budi@example.com', device: 'ESP32-001', status: 'Active' },
  { id: 2, name: 'Siti Aminah', email: 'siti@example.com', device: 'ESP32-002', status: 'Inactive' },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState(initialUsers);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className='p-6 space-y-6'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold'>User Management</h1>
          <p className='text-muted-foreground'>Kelola data pelanggan.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Plus className='w-4 h-4 mr-2' /> Tambah User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Data User</DialogTitle>
              <DialogDescription>Masukkan detail pelanggan SafeBand.</DialogDescription>
            </DialogHeader>
            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label>Nama</Label>
                <Input placeholder='Nama pelanggan' />
              </div>
              <div className='space-y-2'>
                <Label>Email</Label>
                <Input type='email' placeholder='email@contoh.com' />
              </div>
              <div className='space-y-2'>
                <Label>SN Perangkat</Label>
                <Input placeholder='ESP32-XXX' />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsOpen(false)}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>SN Perangkat</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='text-right'>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className='font-medium'>{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.device}</TableCell>
                  <TableCell>
                    <Badge variant={u.status === 'Active' ? 'default' : 'secondary'}>{u.status}</Badge>
                  </TableCell>
                  <TableCell className='text-right'>
                    <Button variant='ghost' size='icon'><Edit2 className='h-4 w-4' /></Button>
                    <Button variant='ghost' size='icon'><Trash2 className='h-4 w-4 text-red-500' /></Button>
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

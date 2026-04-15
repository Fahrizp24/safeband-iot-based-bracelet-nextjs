'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Loader2, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function DeviceManagementPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDevice, setEditingDevice] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'devices'), (snap) => {
      const devicesData = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setDevices(devicesData);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus perangkat ini? Ini akan memutus koneksi user dengan alatnya.')) {
      try {
        await deleteDoc(doc(db, 'devices', id));
        toast.success('Perangkat berhasil dihapus');
      } catch (err) {
        toast.error('Gagal menghapus perangkat');
      }
    }
  };

  const handleEditClick = (device: any) => {
    setEditingDevice({ ...device });
    setIsEditOpen(true);
  };

  const handleUpdateDevice = async () => {
    if (!editingDevice) return;
    setUpdateLoading(true);
    try {
      const deviceRef = doc(db, 'devices', editingDevice.id);
      await updateDoc(deviceRef, {
        ownerName: editingDevice.ownerName,
        status: editingDevice.status
      });
      toast.success('Data perangkat berhasil diperbarui');
      setIsEditOpen(false);
    } catch (err) {
      toast.error('Gagal memperbarui data perangkat');
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div className='p-6 space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Device Management</h1>
        <p className='text-muted-foreground'>Inventaris dan status {devices.length} unit IoT SafeBand.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Perangkat</CardTitle>
          <CardDescription>Semua unit ESP32 yang terdaftar di sistem.</CardDescription>
        </CardHeader>
        <CardContent className='p-0'>
          {loading ? (
            <div className='flex items-center justify-center p-12'>
              <Loader2 className='w-8 h-8 animate-spin text-primary' />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='px-6'>Serial Number</TableHead>
                  <TableHead className='px-6'>Pemilik</TableHead>
                  <TableHead className='px-6'>Status API</TableHead>
                  <TableHead className='px-6'>Terdaftar Pada</TableHead>
                  <TableHead className='text-right px-6'>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className='font-medium px-6'>{d.sn}</TableCell>
                    <TableCell className='px-6'>{d.ownerName || '-'}</TableCell>
                    <TableCell className='px-6'>
                      <Badge variant={d.status === 'active' ? 'default' : 'secondary'}>
                        {d.status?.toUpperCase() || 'INACTIVE'}
                      </Badge>
                    </TableCell>
                    <TableCell className='px-6'>{d.registeredAt ? new Date(d.registeredAt).toLocaleDateString('id-ID') : '-'}</TableCell>
                    <TableCell className='text-right px-6'>
                      <Button variant='ghost' size='icon' onClick={() => handleEditClick(d)}>
                        <Edit2 className='h-4 w-4' />
                      </Button>
                      <Button variant='ghost' size='icon' onClick={() => handleDelete(d.id)}>
                        <Trash2 className='h-4 w-4 text-red-500' />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Edit Device */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Data Perangkat</DialogTitle>
            <DialogDescription>Perbarui informasi unit hardware SafeBand.</DialogDescription>
          </DialogHeader>
          {editingDevice && (
            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label>Serial Number (SN)</Label>
                <Input value={editingDevice.sn} disabled className="bg-slate-100" />
                <p className='text-xs text-muted-foreground'>SN tidak dapat diubah setelah registrasi.</p>
              </div>
              <div className='space-y-2'>
                <Label>Nama Pemilik</Label>
                <Input 
                  value={editingDevice.ownerName} 
                  onChange={(e) => setEditingDevice({ ...editingDevice, ownerName: e.target.value })}
                />
              </div>
              <div className='space-y-2'>
                <Label>Status Perangkat</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={editingDevice.status} 
                  onChange={(e) => setEditingDevice({ ...editingDevice, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Batal</Button>
            <Button onClick={handleUpdateDevice} disabled={updateLoading}>
              {updateLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit2, Plus, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const usersData = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setUsers(usersData);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus user ini?')) {
      try {
        await deleteDoc(doc(db, 'users', id));
        toast.success('User berhasil dihapus');
      } catch (err) {
        toast.error('Gagal menghapus user');
      }
    }
  };

  const handleEditClick = (user: any) => {
    setEditingUser({ 
      ...user,
      name: user.name || '',
      role: user.role || 'customer',
      deviceSn: user.deviceSn || ''
    });
    setIsEditOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser.name?.trim() || !editingUser.deviceSn?.trim()) {
      toast.error('Nama dan Device SN wajib diisi!');
      return;
    }
    if (editingUser.deviceSn && !editingUser.deviceSn.toUpperCase().startsWith('ESP32-')) {
      toast.error("Format Device ID tidak valid. Harus diawali dengan 'ESP32-'");
      setUpdateLoading(false);
      return;
    }

    setUpdateLoading(true);
    try {
      // Cek apakah Device ID sudah digunakan user lain
      if (editingUser.deviceSn) {
        const deviceRef = doc(db, 'devices', editingUser.deviceSn);
        const deviceSnap = await getDoc(deviceRef);
        if (deviceSnap.exists() && deviceSnap.data().userId !== editingUser.id) {
          toast.error('Device ID sudah terdaftar pada akun lain');
          setUpdateLoading(false);
          return;
        }
      }

      const userRef = doc(db, 'users', editingUser.id);
      await updateDoc(userRef, {
        name: editingUser.name || '',
        role: editingUser.role || 'customer',
        deviceSn: editingUser.deviceSn || ''
      });
      toast.success('Data user berhasil diperbarui');
      setIsEditOpen(false);
    } catch (err) {
      toast.error('Gagal memperbarui data user');
      console.log(err);
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div className='p-6 space-y-6'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold'>User Management</h1>
          <p className='text-muted-foreground'>Kelola {users.length} data pelanggan terdaftar.</p>
        </div>
      </div>

      <Card>
        <CardContent className='p-0'>
          {loading ? (
            <div className='flex items-center justify-center p-12'>
              <Loader2 className='w-8 h-8 animate-spin text-primary' />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='px-6'>Nama</TableHead>
                  <TableHead className='px-6'>Email</TableHead>
                  <TableHead className='px-6'>SN Perangkat</TableHead>
                  <TableHead className='px-6'>Role</TableHead>
                  <TableHead className='text-right px-6'>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className='font-medium px-6'>{u.name || '-'}</TableCell>
                    <TableCell className='px-6'>{u.email}</TableCell>
                    <TableCell className='px-6'>{u.deviceSn || '-'}</TableCell>
                    <TableCell className='px-6'>
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                        {u.role?.toUpperCase() || 'CUSTOMER'}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right px-6'>
                      <Button variant='ghost' size='icon' onClick={() => handleEditClick(u)}>
                        <Edit2 className='h-4 w-4' />
                      </Button>
                      <Button variant='ghost' size='icon' onClick={() => handleDelete(u.id)}>
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

      {/* Dialog Edit User */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Data User</DialogTitle>
            <DialogDescription>Perbarui informasi akun pelanggan di bawah ini.</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label>Nama Lengkap</Label>
                <Input 
                  value={editingUser.name} 
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                />
              </div>
              <div className='space-y-2'>
                <Label>Role</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={editingUser.role} 
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                >
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className='space-y-2'>
                <Label>Device SN</Label>
                <Input 
                  value={editingUser.deviceSn} 
                  onChange={(e) => setEditingUser({ ...editingUser, deviceSn: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Batal</Button>
            <Button onClick={handleUpdateUser} disabled={updateLoading}>
              {updateLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

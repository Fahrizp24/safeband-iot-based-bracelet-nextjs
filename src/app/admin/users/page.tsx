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
      return;
    }

    setUpdateLoading(true);
    try {
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
    <div className='p-4 md:p-6 space-y-6'>
      <div>
        <h1 className='text-2xl md:text-3xl font-bold tracking-tight'>User Management</h1>
        <p className='text-sm text-muted-foreground'>Kelola {users.length} data pelanggan terdaftar.</p>
      </div>

      <Card className="shadow-sm overflow-hidden">
        <CardContent className='p-0'>
          {loading ? (
            <div className='flex flex-col items-center justify-center p-12 text-muted-foreground space-y-2'>
              <Loader2 className='w-6 h-6 animate-spin text-primary' />
              <p className="text-xs">Memuat database pelanggan...</p>
            </div>
          ) : (
            <>
              {/* LAYOUT A: DESKTOP TABLE VIEW (Muncul di layar md ke atas) */}
              <div className='hidden md:block w-full overflow-x-auto'>
                <Table>
                  <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                    <TableRow>
                      <th className='px-6 py-3 text-left text-xs font-semibold text-slate-600'>Nama</th>
                      <th className='px-6 py-3 text-left text-xs font-semibold text-slate-600'>Email</th>
                      <th className='px-6 py-3 text-left text-xs font-semibold text-slate-600'>SN Perangkat</th>
                      <th className='px-6 py-3 text-left text-xs font-semibold text-slate-600'>Role</th>
                      <th className='px-6 py-3 text-right text-xs font-semibold text-slate-600'>Aksi</th>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id} className="hover:bg-slate-50/40 transition-colors border-b border-slate-100/70">
                        <TableCell className='font-medium px-6 py-3.5 text-sm'>{u.name || '-'}</TableCell>
                        <TableCell className='px-6 py-3.5 text-sm text-slate-600'>{u.email}</TableCell>
                        <TableCell className='px-6 py-3.5 text-sm font-mono text-slate-600'>{u.deviceSn || '-'}</TableCell>
                        <TableCell className='px-6 py-3.5'>
                          <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="px-2.5 py-0.5 rounded-full font-semibold text-[11px]">
                            {u.role?.toUpperCase() || 'CUSTOMER'}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-right px-6 py-3.5 space-x-1'>
                          <Button variant='ghost' size='icon' className="h-8 w-8" onClick={() => handleEditClick(u)}>
                            <Edit2 className='h-4 w-4 text-slate-600' />
                          </Button>
                          <Button variant='ghost' size='icon' className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50/50" onClick={() => handleDelete(u.id)}>
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* LAYOUT B: MOBILE ULTRA-COMPACT LIST VIEW (Muncul di layar HP / < md) */}
              <div className="block md:hidden divide-y divide-slate-100 bg-white">
                {users.map((u) => (
                  <div key={u.id} className="p-4 flex flex-col gap-2 hover:bg-slate-50/40 transition-colors">
                    {/* Baris Atas: Nama & Role Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900 text-sm truncate">{u.name || '-'}</span>
                      <Badge 
                        variant={u.role === 'admin' ? 'default' : 'secondary'} 
                        className="text-[10px] px-2 py-0.5 font-bold rounded-full shadow-sm shrink-0"
                      >
                        {u.role?.toUpperCase() || 'CUSTOMER'}
                      </Badge>
                    </div>
                    
                    {/* Baris Tengah: Email */}
                    <div className="text-xs text-muted-foreground break-all">
                      {u.email}
                    </div>
                    
                    {/* Baris Bawah: SN Perangkat & Tombol Aksi */}
                    <div className="flex items-center justify-between gap-4 mt-1 pt-2 border-t border-slate-50">
                      <div className="flex items-center gap-1.5 shrink-0 text-xs">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">SN:</span>
                        <span className="font-mono bg-slate-50 text-slate-700 border border-slate-100 rounded px-1.5 py-0.5 text-[11px]">
                          {u.deviceSn || '-'}
                        </span>
                      </div>
                      
                      {/* Gup Tombol Aksi Mobile */}
                      <div className="flex items-center gap-1">
                        <Button 
                          variant='ghost' 
                          size='icon' 
                          className="h-8 w-8 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-md text-slate-600" 
                          onClick={() => handleEditClick(u)}
                        >
                          <Edit2 className='h-3.5 w-3.5' />
                        </Button>
                        <Button 
                          variant='ghost' 
                          size='icon' 
                          className="h-8 w-8 bg-red-50 hover:bg-red-100/80 border border-red-200/40 rounded-md text-red-500" 
                          onClick={() => handleDelete(u.id)}
                        >
                          <Trash2 className='h-3.5 w-3.5' />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fallback Jika Tidak Ada Data */}
              {users.length === 0 && (
                <div className='text-center text-muted-foreground py-12 text-sm'>
                  Belum ada pelanggan yang terdaftar pada sistem.
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog Edit User */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Data User</DialogTitle>
            <DialogDescription>Perbarui informasi akun pelanggan di bawah ini.</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className='space-y-4 py-2'>
              <div className='space-y-1.5'>
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input 
                  id="name"
                  value={editingUser.name} 
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor="role">Role</Label>
                <select 
                  id="role"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={editingUser.role} 
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                >
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor="deviceSn">Device SN</Label>
                <Input 
                  id="deviceSn"
                  value={editingUser.deviceSn} 
                  onChange={(e) => setEditingUser({ ...editingUser, deviceSn: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
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
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Edit2, Loader2, SlidersHorizontal, ArrowUpDown, Search, UserCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  // State Baru untuk Fitur Searching, Filtering, & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [sortBy, setSortBy] = useState('name'); // name, email, deviceSn, role
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc

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
    if (!editingUser.name?.trim()) {
      toast.error('Nama wajib diisi!');
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

  // --- LOGIKA UTAMA FILTERING DAN SORTING DATA ---
  const processedUsers = users
    .filter((user) => {
      // 1. Filter Berdasarkan Role
      const userRole = (user.role || 'customer').toLowerCase();
      if (filterRole !== 'all' && userRole !== filterRole.toLowerCase()) {
        return false;
      }
      // 2. Real-time Search (Nama atau Email)
      const matchesSearch = 
        (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.deviceSn || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    })
    .sort((a, b) => {
      // 3. Sorting Berdasarkan Kolom Pilihan
      let valueA = (a[sortBy] || '').toString().toLowerCase();
      let valueB = (b[sortBy] || '').toString().toLowerCase();

      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className='p-4 md:p-6 space-y-6'>
      <div>
        <h1 className='text-2xl md:text-3xl font-bold tracking-tight'>User Management</h1>
        <p className='text-sm text-muted-foreground'>
          Menampilkan {processedUsers.length} dari {users.length} data pelanggan terdaftar.
        </p>
      </div>

      {/* WRAPPER GRID UTAMA */}
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6 items-start'>
        
        {/* KOLOM KIRI: Tabel Data User (Memakan 3 Kolom di Desktop) */}
        <div className='lg:col-span-3 space-y-4'>
          <Card className="shadow-sm overflow-hidden bg-white">
            <CardContent className='p-0'>
              {loading ? (
                <div className='flex flex-col items-center justify-center p-12 text-muted-foreground space-y-2'>
                  <Loader2 className='w-6 h-6 animate-spin text-primary' />
                  <p className="text-xs">Memuat database pelanggan...</p>
                </div>
              ) : (
                <>
                  {/* LAYOUT DESKTOP VIEW */}
                  <div className='hidden md:block w-full overflow-x-auto'>
                    <Table>
                      <TableHeader className="bg-slate-50/70 border-b border-slate-100">
                        <TableRow>
                          <TableHead className='px-6 py-3 text-xs font-semibold text-slate-600'>Nama</TableHead>
                          <TableHead className='px-6 py-3 text-xs font-semibold text-slate-600'>Email</TableHead>
                          <TableHead className='px-6 py-3 text-xs font-semibold text-slate-600'>SN Perangkat</TableHead>
                          <TableHead className='px-6 py-3 text-xs font-semibold text-slate-600'>Role</TableHead>
                          <TableHead className='px-6 py-3 text-right text-xs font-semibold text-slate-600'>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {processedUsers.map((u) => (
                          <TableRow key={u.id} className="hover:bg-slate-50/40 transition-colors border-b border-slate-100/70">
                            <TableCell className='font-medium px-6 py-3.5 text-sm'>{u.name || '-'}</TableCell>
                            <TableCell className='px-6 py-3.5 text-sm text-slate-600'>{u.email}</TableCell>
                            <TableCell className='px-6 py-3.5 text-sm font-mono text-slate-600'>{u.deviceSn || '-'}</TableCell>
                            <TableCell className='px-6 py-3.5'>
                              <Badge 
                                variant={u.role === 'admin' ? 'default' : u.role === 'user' ? 'outline' : 'secondary'} 
                                className="px-2.5 py-0.5 rounded-full font-semibold text-[11px]"
                              >
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

                  {/* LAYOUT MOBILE VIEW */}
                  <div className="block md:hidden divide-y divide-slate-100 bg-white">
                    {processedUsers.map((u) => (
                      <div key={u.id} className="p-4 flex flex-col gap-2 hover:bg-slate-50/40 transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900 text-sm truncate">{u.name || '-'}</span>
                          <Badge 
                            variant={u.role === 'admin' ? 'default' : u.role === 'user' ? 'outline' : 'secondary'} 
                            className="text-[10px] px-2 py-0.5 font-bold rounded-full shadow-sm shrink-0"
                          >
                            {u.role?.toUpperCase() || 'CUSTOMER'}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground break-all">{u.email}</div>
                        <div className="flex items-center justify-between gap-4 mt-1 pt-2 border-t border-slate-50">
                          <div className="flex items-center gap-1.5 shrink-0 text-xs">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">SN:</span>
                            <span className="font-mono bg-slate-50 text-slate-700 border border-slate-100 rounded px-1.5 py-0.5 text-[11px]">
                              {u.deviceSn || '-'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant='ghost' size='icon' className="h-8 w-8 bg-slate-50 border border-slate-200/60 rounded-md text-slate-600" onClick={() => handleEditClick(u)}>
                              <Edit2 className='h-3.5 w-3.5' />
                            </Button>
                            <Button variant='ghost' size='icon' className="h-8 w-8 bg-red-50 border border-red-200/40 rounded-md text-red-500" onClick={() => handleDelete(u.id)}>
                              <Trash2 className='h-3.5 w-3.5' />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {processedUsers.length === 0 && (
                    <div className='text-center text-muted-foreground py-12 text-sm'>
                      Tidak ada hasil yang cocok dengan kriteria pencarian/filter.
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* KOLOM KANAN: Panel Filter & Sorting (order-first membuat panel ini berada di atas tabel khusus layar HP) */}
        <div className='lg:col-span-1 order-first lg:order-none space-y-4'>
          <Card className="shadow-sm border border-slate-200/80 bg-white">
            <CardHeader className="pb-3 flex flex-row items-center space-x-2 space-y-0">
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
              <div>
                <CardTitle className="text-base font-semibold">Filter & Urutan</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              
              {/* 1. Input Live Search */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Search className="w-3 h-3" /> Cari Pengguna
                </Label>
                <Input 
                  placeholder="Nama, email, atau SN..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* 2. Dropdown Filter Berdasarkan Role */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <UserCheck className="w-3 h-3" /> Kategori Role
                </Label>
                <select 
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  value={filterRole} 
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="all">Semua Jenis Role</option>
                  <option value="customer">Customer</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* 3. Dropdown Sorting Parameter */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <ArrowUpDown className="w-3 h-3" /> Urutkan Berdasarkan
                </Label>
                <select 
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="name">Abjad Nama</option>
                  <option value="email">Alamat Email</option>
                  <option value="deviceSn">SN Perangkat (Device)</option>
                  <option value="role">Hak Akses / Role</option>
                </select>
              </div>

              {/* 4. Dropdown Sorting Order (Asc / Desc) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-500">Arah Urutan</Label>
                <div className="flex gap-1">
                  <Button 
                    type="button" 
                    variant={sortOrder === 'asc' ? 'default' : 'outline'} 
                    className="flex-1 h-8 text-xs font-medium"
                    onClick={() => setSortOrder('asc')}
                  >
                    A-Z (Asc)
                  </Button>
                  <Button 
                    type="button" 
                    variant={sortOrder === 'desc' ? 'default' : 'outline'} 
                    className="flex-1 h-8 text-xs font-medium"
                    onClick={() => setSortOrder('desc')}
                  >
                    Z-A (Desc)
                  </Button>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>

      {/* Dialog Edit User */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Data User</DialogTitle>
            <DialogDescription>Perbarui informasi akun pelanggan di bawah ini.</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className='space-y-4 py-2 text-sm'>
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
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={editingUser.role} 
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                >
                  <option value="customer">Customer</option>
                  <option value="user">User</option>
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
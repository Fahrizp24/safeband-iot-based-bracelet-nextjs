'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Loader2, Edit2, Trash2, SlidersHorizontal, Search, ArrowUpDown, Cpu } from 'lucide-react';
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

  // State untuk Fitur Searching, Filtering, & Sorting Panel
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('sn'); // sn, ownerName, registeredAt
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc

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

  // --- FUNGSI DINAMIS UNTUK BADGE STATUS ---
  const getStatusBadge = (status: string) => {
    const currentStatus = status?.toLowerCase() || 'inactive';
    
    switch (currentStatus) {
      case 'active':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-none hover:bg-emerald-50 px-2.5 py-0.5 rounded-full font-semibold text-[11px]">
            ACTIVE
          </Badge>
        );
      case 'maintenance':
        return (
          <Badge className="bg-amber-50 text-amber-700 border border-amber-200/60 shadow-none hover:bg-amber-50 px-2.5 py-0.5 rounded-full font-semibold text-[11px]">
            MAINTENANCE
          </Badge>
        );
      case 'inactive':
      default:
        return (
          <Badge className="bg-rose-50 text-rose-700 border border-rose-200/60 shadow-none hover:bg-rose-50 px-2.5 py-0.5 rounded-full font-semibold text-[11px]">
            INACTIVE
          </Badge>
        );
    }
  };

  // --- LOGIKA FILTERING DAN SORTING DATA ---
  const processedDevices = devices
    .filter((device) => {
      // 1. Filter Berdasarkan Status
      if (filterStatus !== 'all' && (device.status || 'inactive').toLowerCase() !== filterStatus.toLowerCase()) {
        return false;
      }
      // 2. Search Berdasarkan Serial Number atau Nama Pemilik
      const matchesSearch = 
        (device.sn || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (device.ownerName || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    })
    .sort((a, b) => {
      // 3. Pengurutan Data (Sorting)
      let valueA = a[sortBy];
      let valueB = b[sortBy];

      if (sortBy === 'registeredAt') {
        valueA = valueA ? new Date(valueA).getTime() : 0;
        valueB = valueB ? new Date(valueB).getTime() : 0;
      } else {
        valueA = (valueA || '').toString().toLowerCase();
        valueB = (valueB || '').toString().toLowerCase();
      }

      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className='p-4 md:p-6 space-y-6'>
      <div>
        <h1 className='text-2xl md:text-3xl font-bold tracking-tight'>Device Management</h1>
        <p className='text-sm text-muted-foreground'>
          Inventaris dan status {processedDevices.length} dari {devices.length} unit IoT SafeBand terdaftar.
        </p>
      </div>

      {/* GRID WRAPPER UTAMA */}
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6 items-start'>
        
        {/* KOLOM KIRI: Tabel Data Devices (Memakan 3 Kolom di Desktop) */}
        <div className='lg:col-span-3 space-y-4'>
          <Card className="shadow-sm overflow-hidden bg-white">
            <CardContent className='p-0'>
              {loading ? (
                <div className='flex flex-col items-center justify-center p-12 text-muted-foreground space-y-2'>
                  <Loader2 className='w-6 h-6 animate-spin text-primary' />
                  <p className="text-xs">Memuat database perangkat...</p>
                </div>
              ) : (
                <>
                  {/* DESKTOP TABLE VIEW */}
                  <div className='hidden md:block w-full overflow-x-auto'>
                    <Table>
                      <TableHeader className="bg-slate-50/70 border-b border-slate-100">
                        <TableRow>
                          <TableHead className='px-6 py-3 text-xs font-semibold text-slate-600'>Serial Number</TableHead>
                          <TableHead className='px-6 py-3 text-xs font-semibold text-slate-600'>Pemilik</TableHead>
                          <TableHead className='px-6 py-3 text-xs font-semibold text-slate-600'>Status API</TableHead>
                          <TableHead className='px-6 py-3 text-xs font-semibold text-slate-600'>Terdaftar Pada</TableHead>
                          <TableHead className='text-right px-6 py-3 text-xs font-semibold text-slate-600'>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {processedDevices.map((d) => (
                          <TableRow key={d.id} className="hover:bg-slate-50/40 transition-colors border-b border-slate-100/70">
                            <TableCell className='font-mono font-medium px-6 py-3.5 text-sm text-slate-700'>{d.sn}</TableCell>
                            <TableCell className='px-6 py-3.5 text-sm text-slate-600'>{d.ownerName || '-'}</TableCell>
                            <TableCell className='px-6 py-3.5'>
                              {getStatusBadge(d.status)}
                            </TableCell>
                            <TableCell className='px-6 py-3.5 text-sm text-slate-500'>
                              {d.registeredAt ? new Date(d.registeredAt).toLocaleDateString('id-ID') : '-'}
                            </TableCell>
                            <TableCell className='text-right px-6 py-3.5 space-x-1'>
                              <Button variant='ghost' size='icon' className="h-8 w-8" onClick={() => handleEditClick(d)}>
                                <Edit2 className='h-4 w-4 text-slate-600' />
                              </Button>
                              <Button variant='ghost' size='icon' className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50/50" onClick={() => handleDelete(d.id)}>
                                <Trash2 className='h-4 w-4' />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* MOBILE LIST VIEW */}
                  <div className="block md:hidden divide-y divide-slate-100 bg-white">
                    {processedDevices.map((d) => (
                      <div key={d.id} className="p-4 flex flex-col gap-2 hover:bg-slate-50/40 transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-slate-900 text-sm shrink-0">{d.sn}</span>
                          {getStatusBadge(d.status)}
                        </div>
                        
                        <div className="text-xs text-slate-600 flex justify-between mt-1">
                          <span className="text-muted-foreground">Pemilik:</span>
                          <span className="font-medium text-slate-800">{d.ownerName || '-'}</span>
                        </div>

                        <div className="flex items-center justify-between gap-4 mt-1 pt-2 border-t border-slate-50">
                          <div className="text-[11px] text-muted-foreground">
                            Tgl: {d.registeredAt ? new Date(d.registeredAt).toLocaleDateString('id-ID') : '-'}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Button variant='ghost' size='icon' className="h-8 w-8 bg-slate-50 border border-slate-200/60 rounded-md text-slate-600" onClick={() => handleEditClick(d)}>
                              <Edit2 className='h-3.5 w-3.5' />
                            </Button>
                            <Button variant='ghost' size='icon' className="h-8 w-8 bg-red-50 border border-red-200/40 rounded-md text-red-500" onClick={() => handleDelete(d.id)}>
                              <Trash2 className='h-3.5 w-3.5' />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {processedDevices.length === 0 && (
                    <div className='text-center text-muted-foreground py-12 text-sm'>
                      Tidak ada hasil unit hardware yang cocok dengan kriteria filter.
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* KOLOM KANAN: Panel Filter & Sorting Control Card */}
        <div className='lg:col-span-1 order-first lg:order-none space-y-4'>
          <Card className="shadow-sm border border-slate-200/80 bg-white">
            <CardHeader className="pb-3 flex flex-row items-center space-x-2 space-y-0">
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
              <div>
                <CardTitle className="text-base font-semibold">Filter Perangkat</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              
              {/* 1. Live Search Input */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Search className="w-3 h-3" /> Cari Perangkat
                </Label>
                <Input 
                  placeholder="Cari SN atau pemilik..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* 2. Filter Dropdown Berdasarkan Status */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Cpu className="w-3 h-3" /> Filter Status Perangkat
                </Label>
                <select 
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">Semua Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                  <option value="maintenance">Maintenance Only</option>
                </select>
              </div>

              {/* 3. Dropdown Atribut Sorting */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <ArrowUpDown className="w-3 h-3" /> Urutkan Berdasarkan
                </Label>
                <select 
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="sn">Serial Number (SN)</option>
                  <option value="ownerName">Nama Pemilik</option>
                  <option value="registeredAt">Tanggal Registrasi</option>
                </select>
              </div>

              {/* 4. Filter Arah Urutan (Asc / Desc) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-500">Arah Urutan</Label>
                <div className="flex gap-1">
                  <Button 
                    type="button" 
                    variant={sortOrder === 'asc' ? 'default' : 'outline'} 
                    className="flex-1 h-8 text-xs font-medium"
                    onClick={() => setSortOrder('asc')}
                  >
                    Menaik (Asc)
                  </Button>
                  <Button 
                    type="button" 
                    variant={sortOrder === 'desc' ? 'default' : 'outline'} 
                    className="flex-1 h-8 text-xs font-medium"
                    onClick={() => setSortOrder('desc')}
                  >
                    Menurun (Desc)
                  </Button>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>

      {/* Dialog Edit Perangkat */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Data Perangkat</DialogTitle>
            <DialogDescription>Perbarui informasi unit hardware SafeBand.</DialogDescription>
          </DialogHeader>
          {editingDevice && (
            <div className='space-y-4 py-2 text-sm'>
              <div className='space-y-1.5'>
                <Label>Serial Number (SN)</Label>
                <Input value={editingDevice.sn} disabled className="bg-slate-100 font-mono" />
                <p className='text-[11px] text-muted-foreground'>SN tidak dapat diubah setelah registrasi.</p>
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor="owner">Nama Pemilik</Label>
                <Input 
                  id="owner"
                  value={editingDevice.ownerName || ''} 
                  onChange={(e) => setEditingDevice({ ...editingDevice, ownerName: e.target.value })}
                />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor="statusSelect">Status Perangkat</Label>
                <select 
                  id="statusSelect"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={editingDevice.status || 'inactive'} 
                  onChange={(e) => setEditingDevice({ ...editingDevice, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
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
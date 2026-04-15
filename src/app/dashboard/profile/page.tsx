'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [deviceSn, setDeviceSn] = useState(session?.user?.deviceSn);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      if (session?.user?.email) {
        try {
          const userRef = doc(db, 'users', session.user.email);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setDeviceSn(userSnap.data().deviceSn || session.user.deviceSn || '');
          } else {
            setDeviceSn(session.user.deviceSn || ''); // Jika doc belum ada
          }
        } catch (error) {
          console.error("Gagal menarik data user:", error);
          setDeviceSn(session.user.deviceSn || ''); // Jika rules block read
        }
      }
      setFetching(false);
    }
    fetchUserData();
  }, [session]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.email) {
      toast.error('Sesi tidak ditemukan. Silakan login ulang.');
      return;
    }

    if (deviceSn && !deviceSn.toUpperCase().startsWith('ESP32-')) {
      toast.error("Format Device ID tidak valid. Harus diawali dengan 'ESP32-' (Contoh: ESP32-001)");
      return;
    }
    
    // Cek apakah Device ID sudah digunakan user lain
    if (deviceSn) {
      const deviceRef = doc(db, 'devices', deviceSn);
      const deviceSnap = await getDoc(deviceRef);
      if (deviceSnap.exists() && deviceSnap.data().userId !== session.user.email) {
        toast.error('Device ID sudah terdaftar pada akun lain');
        return;
      }
    }

    setLoading(true);
    try {
      const userRef = doc(db, 'users', session.user.email);
      await updateDoc(userRef, { deviceSn });

      if (deviceSn) {
        await setDoc(doc(db, 'devices', deviceSn), {
          sn: deviceSn,
          userId: session.user.email,
          ownerName: session.user.name || '',
          registeredAt: new Date().toISOString(),
          status: 'active'
        }, { merge: true });
      }

      await update({ deviceSn }); // Meminta NextAuth perbarui session
      toast.success('Device ID berhasil diperbarui');
    } catch (error) {
      console.error(error);
      toast.error('Gagal memperbarui Device ID');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-6 text-muted-foreground flex items-center justify-center min-h-[400px]">Memuat data profil...</div>;
  
  return (
    <div className='p-6 space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Profil & Perangkat</h1>
        <p className='text-muted-foreground'>Kelola informasi akun dan sambungkan Device ID SafeBand Anda.</p>
      </div>

      <Card className="max-w-2xl shadow-sm border">
        <form onSubmit={handleSave}>
          <CardHeader>
            <CardTitle>Pengaturan Perangkat</CardTitle>
            <CardDescription>
              Masukkan Serial Number perangkat SafeBand Anda yang tertera pada produk.
            </CardDescription>
            <br />
          </CardHeader>
          <CardContent className='space-y-4 pb-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Nama Akun</Label>
                <Input disabled value={session?.user?.name || ''} className="bg-muted/50" />
              </div>
              <div className='space-y-2'>
                <Label>Email</Label>
                <Input disabled value={session?.user?.email || ''} className="bg-muted/50" />
              </div>
            </div>

            <div className='space-y-2 pt-2'>
              <Label htmlFor='deviceSn' className="font-semibold">Serial Number (Device ID)</Label>
              <Input
                id='deviceSn'
                placeholder='Contoh: ESP32-001'
                value={deviceSn?.toUpperCase() || ''}
                onChange={(e) => setDeviceSn(e.target.value.toUpperCase())}
                required
                className="font-mono uppercase"
              />
              <p className="text-[10px] text-muted-foreground italic">
                Sistem akan otomatis menyimpan ID dalam format huruf besar.
              </p>
            </div>
          </CardContent>
          <CardContent className="pt-0">
             <Button type='submit' className='w-full sm:w-auto px-8' disabled={loading}>
              {loading && <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />}
              Simpan Perubahan
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}

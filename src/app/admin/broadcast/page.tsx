'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Send, Bell, Info, Wrench, AlertTriangle, RefreshCw } from 'lucide-react';

// Definisi tipe data dokumentasi notifikasi dari Firestore
interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  targetAudience: string;
  isGlobal: boolean;
  createdAt: string;
}

export default function BroadcastPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [type, setType] = useState('broadcast');
  const [isSending, setIsSending] = useState(false);
  
  // State untuk menampung data asli dari Firestore
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data real-time menggunakan useEffect
  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const listenToNotifications = async () => {
      try {
        const { db } = await import('@/lib/firebase');
        const { collection, query, orderBy, onSnapshot } = await import('firebase/firestore');

        if (!isMounted) return;

        // Query mengambil data dari koleksi 'notifications' diurutkan berdasarkan yang terbaru
        const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));

        unsubscribe = onSnapshot(q, (snapshot) => {
          const docsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as NotificationItem[];

          setNotifications(docsData);
          setIsLoading(false);
        });
      } catch (error) {
        console.error('Gagal mengambil riwayat notifikasi:', error);
        setIsLoading(false);
      }
    };

    listenToNotifications();

    // Cleanup listener saat komponen unmount agar tidak memakan memori/kuota read Firebase
    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const getIcon = (notifType: string) => {
    switch (notifType) {
      case 'update': return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case 'maintenance': return <Wrench className="w-4 h-4 text-orange-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-green-500" />;
    }
  };

  // Helper untuk memformat ISO String menjadi waktu lokal Indonesia yang rapi
  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Waktu tidak valid';
    }
  };

  const handleBroadcast = async () => {
    if (!title || !message) {
      toast.error('Judul dan pesan tidak boleh kosong.');
      return;
    }

    setIsSending(true);
    try {
      const { db } = await import('@/lib/firebase');
      const { collection, addDoc } = await import('firebase/firestore');

      await addDoc(collection(db, 'notifications'), {
        title,
        message,
        type,
        targetAudience,
        isGlobal: targetAudience === 'all',
        createdAt: new Date().toISOString()
      });

      toast.success(`Pengumuman berhasil disebarkan ke ${targetAudience}.`);
      setTitle('');
      setMessage('');
      setTargetAudience('all');
      setType('broadcast');
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengirim broadcast.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className='p-6 space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Broadcast News</h1>
        <p className='text-muted-foreground'>Kirim pengumuman massal ke dashboard target pengguna.</p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 items-start'>
        
        {/* KOLOM KIRI: Form Pembuatan */}
        <div className='lg:col-span-2 space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Buat Pengumuman Baru</CardTitle>
              <CardDescription>Pesan ini akan disaring berdasarkan target audiens dan tipe yang dipilih.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label>Target Audiens</Label>
                  <Select value={targetAudience} onValueChange={setTargetAudience}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih target" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Pengguna</SelectItem>
                      <SelectItem value="customer">Hanya Customer</SelectItem>
                      <SelectItem value="admin">Hanya Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label>Tipe Pengumuman</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="broadcast">Umum / Broadcast</SelectItem>
                      <SelectItem value="update">Update Firmware / Sistem</SelectItem>
                      <SelectItem value="maintenance">Pemeliharaan (Maintenance)</SelectItem>
                      <SelectItem value="warning">Peringatan (Warning)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className='space-y-2'>
                <Label>Judul Pengumuman</Label>
                <Input 
                  placeholder='Contoh: Update Firmware v2.1.0' 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)} 
                />
              </div>

              <div className='space-y-2'>
                <Label>Isi Pesan</Label>
                <Textarea 
                  placeholder='Ketikkan detail pengumuman di sini...' 
                  className='min-h-[150px]'
                  value={message}
                  onChange={(e) => setMessage(e.target.value)} 
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleBroadcast} className='w-full' disabled={isSending}>
                <Send className='w-4 h-4 mr-2' /> {isSending ? 'Mengirim...' : 'Kirim Broadcast'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* KOLOM KANAN: Panel Riwayat Notifikasi Real-time */}
        <div className='lg:col-span-1'>
          <Card>
            <CardHeader className="flex flex-row items-center space-x-2 space-y-0 pb-3">
              <Bell className="w-5 h-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Riwayat Broadcast</CardTitle>
                <CardDescription>Daftar pengumuman terakhir</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border max-h-[480px] overflow-y-auto pr-1">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Memuat data...</p>
                ) : notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Belum ada riwayat pengumuman.</p>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className="py-3 first:pt-0 last:pb-0 flex items-start space-x-3">
                      <div className="mt-1 bg-muted p-1.5 rounded-md shrink-0">
                        {getIcon(notif.type)}
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="text-sm font-medium leading-none truncate" title={notif.title}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1" title={notif.message}>
                          {notif.message}
                        </p>
                        <div className="flex items-center space-x-2 text-[10px] text-muted-foreground pt-1">
                          <span className="capitalize bg-secondary px-1.5 py-0.5 rounded font-medium">
                            Target: {notif.targetAudience}
                          </span>
                          <span>•</span>
                          <span>{formatTime(notif.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Send } from 'lucide-react';

export default function BroadcastPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const [isSending, setIsSending] = useState(false);

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
        type: 'broadcast',
        isGlobal: true, // Untuk menandai ini ditujukan ke semua user
        createdAt: new Date().toISOString()
      });

      toast.success('Pengumuman berhasil disebarkan ke semua pelanggan.');
      setTitle('');
      setMessage('');
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
        <p className='text-muted-foreground'>Kirim pengumuman massal ke seluruh dashboard customer.</p>
      </div>

      <Card className='max-w-2xl'>
        <CardHeader>
          <CardTitle>Buat Pengumuman Baru</CardTitle>
          <CardDescription>Pesan ini akan muncul di halaman Notifications semua pengguna.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
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
  );
}

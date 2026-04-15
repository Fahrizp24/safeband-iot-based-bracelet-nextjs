'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Save, Phone } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Icons } from '@/components/icons';

export default function EmergencySetupPage() {
  const { data: session } = useSession();
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchContact() {
      if (session?.user?.email) {
        try {
          const docRef = doc(db, 'users', session.user.email);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.emergencyContact) {
              setContact(data.emergencyContact);
            } else if (data.emergencyContacts && data.emergencyContacts.length > 0) {
              setContact(data.emergencyContacts[0]);
            }
          }
        } catch (error) {
          console.error("Gagal menarik data emergency contact", error);
        }
      }
      setLoading(false);
    }
    fetchContact();
  }, [session]);

  const handleSave = async () => {
    if (!session?.user?.email) return;
    
    setIsSaving(true);
    try {
      const docRef = doc(db, 'users', session.user.email);
      // Simpan ke 'emergencyContact' dan update 'emergencyContacts' (array) agar kompatibel
      await updateDoc(docRef, {
        emergencyContact: contact.trim(),
        emergencyContacts: [contact.trim()]
      });
      toast.success('Kontak darurat berhasil diperbarui.');
    } catch (error) {
      console.error(error);
      toast.error('Gagal memperbarui kontak.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
       <div className="flex flex-col items-center justify-center p-12 text-muted-foreground min-h-[400px]">
         <Icons.spinner className="h-8 w-8 animate-spin mb-4" />
         <p>Memuat Pengaturan Darurat...</p>
       </div>
    );
  }

  return (
    <div className='p-6 space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Emergency Setup</h1>
        <p className='text-muted-foreground'>Konfigurasi peringatan darurat dan sistem kontak pertolongan.</p>
      </div>

      <Card className='max-w-2xl shadow-sm border'>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Edit Kontak Darurat
          </CardTitle>
          <CardDescription>
            Masukkan satu nomor kontak utama (keluarga, perawat, atau wali) yang akan dihubungi otomatis jika terdeteksi insiden jatuh.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-2'>
            <Label htmlFor='phone' className="font-semibold">Nomor Telepon / WhatsApp</Label>
            <Input 
              id='phone' 
              placeholder='Contoh: 08123456789' 
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              disabled={isSaving}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="py-6 text-lg"
            />
            <p className="text-xs text-muted-foreground italic">
              Sistem akan mengirimkan koordinat lokasi ke nomor ini saat keadaan darurat terdeteksi.
            </p>
          </div>
          
          <Button onClick={handleSave} disabled={isSaving || !contact.trim()} className="w-full sm:w-auto px-10 py-6 text-base shadow-md">
            {isSaving ? (
              <>
                <Icons.spinner className="mr-2 h-5 w-5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className='h-5 w-5 mr-2' />
                Simpan Perubahan
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

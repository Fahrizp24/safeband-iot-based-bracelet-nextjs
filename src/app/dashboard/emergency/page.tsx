'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Save, Phone, User, Heart } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { Icons } from '@/components/icons';

export default function EmergencySetupPage() {
  const { data: session } = useSession();
  
  const [formData, setFormData] = useState({
    elderlyName: '',
    contactName: '',
    whatsappNumber: ''
  });
  
  const [docId, setDocId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 🟢 PERBAIKAN: Jika session.user.id kaga keluar, pakai email atau nama sebagai fallback UID
  const currentUserId = session?.user?.id || session?.user?.email || 'guest_user';

  useEffect(() => {
    async function fetchContact() {
      if (currentUserId && currentUserId !== 'guest_user') {
        try {
          const q = query(
            collection(db, 'emergency_contacts'), 
            where('userId', '==', currentUserId)
          );
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const docSnap = querySnapshot.docs[0];
            const data = docSnap.data();
            setDocId(docSnap.id);
            setFormData({
              elderlyName: data.elderlyName || '',
              contactName: data.contactName || '',
              whatsappNumber: data.whatsappNumber || ''
            });
          }
        } catch (error) {
          console.error("Gagal menarik data emergency contact", error);
        }
      }
      setLoading(false);
    }
    fetchContact();
  }, [currentUserId]);

  const handleSave = async () => {
    if (!currentUserId || currentUserId === 'guest_user') {
      toast.error('Gagal menyimpan: Sesi user tidak valid. Silakan login ulang.');
      return;
    }
    
    if (!formData.elderlyName.trim() || !formData.contactName.trim() || !formData.whatsappNumber.trim()) {
      toast.error('Semua data formulir wajib diisi!');
      return;
    }

    setIsSaving(true);
    try {
      if (docId) {
        const docRef = doc(db, 'emergency_contacts', docId);
        await updateDoc(docRef, {
          elderlyName: formData.elderlyName.trim(),
          contactName: formData.contactName.trim(),
          whatsappNumber: formData.whatsappNumber.trim(),
          updatedAt: new Date().toISOString()
        });
      } else {
        const newDoc = await addDoc(collection(db, 'emergency_contacts'), {
          userId: currentUserId, 
          elderlyName: formData.elderlyName.trim(),
          contactName: formData.contactName.trim(),
          whatsappNumber: formData.whatsappNumber.trim(),
          createdAt: new Date().toISOString()
        });
        setDocId(newDoc.id);
      }
      
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
            Edit Info & Kontak Darurat
          </CardTitle>
          <CardDescription>
            Masukkan informasi lansia serta kontak penanggung jawab utama yang akan dihubungi otomatis oleh Safeband jika insiden jatuh terdeteksi.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          
          <div className='space-y-2'>
            <Label htmlFor='elderlyName' className="font-semibold flex items-center gap-2">
              <Heart className="h-4 w-4 text-muted-foreground" /> Nama Lansia
            </Label>
            <Input 
              id='elderlyName' 
              placeholder='Contoh: Oma Sulastri' 
              value={formData.elderlyName}
              onChange={(e) => setFormData({ ...formData, elderlyName: e.target.value })}
              disabled={isSaving}
              className="py-6 text-base"
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='contactName' className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" /> Nama Kontak Darurat
            </Label>
            <Input 
              id='contactName' 
              placeholder='Contoh: Budi (Anak Pertama)' 
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              disabled={isSaving}
              className="py-6 text-base"
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='whatsappNumber' className="font-semibold flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" /> Nomor WA Kontak Darurat
            </Label>
            <Input 
              id='whatsappNumber' 
              placeholder='Contoh: 08123456789' 
              value={formData.whatsappNumber}
              onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
              disabled={isSaving}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="py-6 text-base"
            />
          </div>
          
          {/* 🟢 PERBAIKAN: Tombol dilepas kuncian ketatnya, hanya ngunci pas isSaving */}
          <Button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="w-full sm:w-auto px-10 py-6 text-base shadow-md"
          >
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
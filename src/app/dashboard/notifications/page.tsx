'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bell, AlertTriangle, Info, BatteryWarning, Megaphone } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { Icons } from '@/components/icons';

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) return;

    // Gunakan Map untuk menampung data unik berdasarkan ID dokumen
    const notificationMap = new Map<string, any>();

    const updateNotifications = () => {
      // Ubah Map menjadi Array dan urutkan berdasarkan waktu
      const sorted = Array.from(notificationMap.values()).sort((a: any, b: any) => {
        const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
        const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
        return timeB - timeA;
      });
      setNotifications(sorted);
      setLoading(false);
    };

    const processSnapshot = (snap: any) => {
      snap.forEach((doc: any) => {
        notificationMap.set(doc.id, { id: doc.id, ...doc.data() });
      });
      updateNotifications();
    };

    const setupListeners = async () => {
      const userRef = doc(db, 'users', session.user.email as string);
      const userSnap = await getDoc(userRef);
      const userSn = userSnap.exists() ? userSnap.data().deviceSn : null;
      const collRef = collection(db, 'notifications');

      // 1. Query: Global (isGlobal: true)
      const unsubGlobal = onSnapshot(query(collRef, where('isGlobal', '==', true)), processSnapshot);

      // 2. Query: Audience 'customer' (INI YANG ANDA BUTUHKAN)
      // Data dengan targetAudience: 'customer' akan ditarik terlepas dari isGlobal
      const unsubCustomer = onSnapshot(query(collRef, where('targetAudience', '==', 'customer')), processSnapshot);

      // 3. Query: Notifikasi untuk User ID spesifik
      const unsubUser = onSnapshot(query(collRef, where('userId', '==', session.user.email)), processSnapshot);

      // 4. Query: Notifikasi untuk Device SN
      let unsubDevice: any = null;
      if (userSn) {
        const qDevice = query(collRef, where('deviceSn', 'in', [userSn, userSn.toUpperCase(), userSn.toLowerCase()]));
        unsubDevice = onSnapshot(qDevice, processSnapshot);
      }

      return () => {
        unsubGlobal();
        unsubCustomer();
        unsubUser();
        if (unsubDevice) unsubDevice();
      };
    };

    let unsubscribe: any;
    setupListeners().then(unsub => { unsubscribe = unsub; });

    return () => { if (unsubscribe) unsubscribe(); };
  }, [session, status]);

  // UI Helper functions
  const getIcon = (type: string) => {
    switch (type) {
      case 'danger': return AlertTriangle;
      case 'warning': return BatteryWarning;
      case 'broadcast': return Megaphone;
      case 'info':
      default: return Info;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'danger': return 'text-red-500';
      case 'warning': return 'text-orange-500';
      case 'broadcast': return 'text-indigo-500';
      case 'info': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className='p-6 space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Notifications</h1>
        <p className='text-muted-foreground'>Pusat notifikasi untuk {session?.user?.name}.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pemberitahuan Terbaru</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {loading ? (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
              <Icons.spinner className="h-8 w-8 animate-spin mb-4" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Belum ada notifikasi.</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const IconComp = getIcon(notif.type);
              const colorClass = getColor(notif.type);
              const timeStr = notif.createdAt ? new Date(notif.createdAt).toLocaleString('id-ID') : 'Baru saja';
              
              return (
                <div key={notif.id} className='flex items-start gap-4 p-4 border rounded-md shadow-sm hover:bg-muted/30'>
                  <div className={`mt-1 ${colorClass}`}>
                    <IconComp className='h-6 w-6' />
                  </div>
                  <div>
                    <h4 className='font-semibold'>{notif.title}</h4>
                    <p className='text-sm text-muted-foreground'>{notif.message}</p>
                    <p className='text-xs text-gray-400 mt-1'>{timeStr}</p>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
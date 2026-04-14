'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bell, AlertTriangle, Info, BatteryWarning } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { Icons } from '@/components/icons';

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) return;

    // First fetch user's deviceSn, or we can just fetch notifications by userId
    // Getting deviceSn ensures we only see notifications for connected devices
    const fetchNotifications = async () => {
      const userRef = doc(db, 'users', session.user.email as string);
      const userSnap = await getDoc(userRef);
      const userSn = userSnap.exists() ? userSnap.data().deviceSn : null;

      // Bypass orderBy untuk mencegah kebutuhan klik Composite Index Firebase
      // Tambahkan 'in' operator agar aman dari huruf besar/kecil (Case Insensitive)
      let notifQuery: any;
      
      if (userSn) {
        const userSnUpper = userSn.toUpperCase();
        const userSnLower = userSn.toLowerCase();
        notifQuery = query(
          collection(db, 'notifications'), 
          where('deviceSn', 'in', [userSn, userSnUpper, userSnLower])
        );
      } else {
        notifQuery = query(
          collection(db, 'notifications'), 
          where('userId', '==', session.user.email)
        );
      }

      const unsub = onSnapshot(notifQuery, (snapshot: any) => {
        const notifData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
        
        // Sorting secara manual di client (Javascript) agar tidak memberatkan Firestore
        notifData.sort((a: any, b: any) => {
           const timeA = new Date(a.createdAt as string).getTime() || 0;
           const timeB = new Date(b.createdAt as string).getTime() || 0;
           return timeB - timeA;
        });
        
        setNotifications(notifData);
        setLoading(false);
      }, (error: any) => {
        console.error("Gagal menarik notifikasi:", error);
        setLoading(false);
      });

      return unsub;
    };

    let unsubscribe: any;
    fetchNotifications().then(unsub => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [session, status]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'danger': return AlertTriangle;
      case 'warning': return BatteryWarning;
      case 'info':
      default: return Info;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'danger': return 'text-red-500';
      case 'warning': return 'text-orange-500';
      case 'info': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className='p-6 space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Notifications</h1>
        <p className='text-muted-foreground'>Pusat notifikasi sistem {session?.user?.name ? `untuk ${session.user.name}` : ''}.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pemberitahuan Terbaru</CardTitle>
          <CardDescription>Semua peringatan dan update dari perangkat Anda.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {loading ? (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
              <Icons.spinner className="h-8 w-8 animate-spin mb-4" />
              <p>Memuat notifikasi...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground border border-dashed rounded-lg">
              <Bell className="h-12 w-12 mb-4 text-gray-300" />
              <p>Belum ada notifikasi saat ini.</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const IconComp = getIcon(notif.type);
              const colorClass = getColor(notif.type);
              
              // Formatting time
              let timeStr = 'Baru saja';
              if (notif.createdAt) {
                const date = new Date(notif.createdAt);
                timeStr = isNaN(date.getTime()) ? notif.createdAt : date.toLocaleString('id-ID');
              }
              
              return (
                <div key={notif.id} className='flex items-start gap-4 p-4 border rounded-md'>
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

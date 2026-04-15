'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, AppWindow, FileWarning } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

export default function AdminOverview() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalDevices, setTotalDevices] = useState(0);
  const [todayIncidents, setTodayIncidents] = useState(0);
  const [pendingIncidents, setPendingIncidents] = useState(0);

  useEffect(() => {
    // 1. Total User
    const usersUnsub = onSnapshot(collection(db, 'users'), (snap) => {
      setTotalUsers(snap.size);
    });

    // 2. Total Device
    const devicesUnsub = onSnapshot(collection(db, 'devices'), (snap) => {
      setTotalDevices(snap.size);
    });

    // 3. Incidents Hari Ini & Pending
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);

    const incidentsUnsub = onSnapshot(collection(db, 'incidents'), (snap) => {
      const docs = snap.docs.map(d => d.data());
      
      // Filter hari ini (berdasarkan field timestamp/rawTime)
      const today = docs.filter(d => {
        const time = d.rawTime || d.timestamp;
        if (!time) return false;
        
        // Konversi ke Date Object dengan benar
        const dDate = time.seconds ? new Date(time.seconds * 1000) : new Date(time);
        return dDate >= startOfToday;
      });
      setTodayIncidents(today.length);

      // Filter yang statusnya masih 'open'
      const pending = docs.filter(d => d.status === 'open');
      setPendingIncidents(pending.length);
    });

    return () => {
      usersUnsub();
      devicesUnsub();
      incidentsUnsub();
    };
  }, []);

  return (
    <div className='p-6 space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Admin Dashboard</h1>
        <p className='text-muted-foreground'>Overview sistem global dan statistik terkini.</p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Total User Terdaftar</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalUsers.toLocaleString()}</div>
            <p className='text-xs text-muted-foreground'>Pendaftar unik di sistem</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Insiden Hari Ini</CardTitle>
            <FileWarning className='h-4 w-4 text-red-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600'>{todayIncidents}</div>
            <p className='text-xs text-muted-foreground animate-pulse text-red-400'>{pendingIncidents} belum ditangani</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Perangkat Terdaftar</CardTitle>
            <AppWindow className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalDevices}</div>
            <p className='text-xs text-muted-foreground'>Unit ESP32-MPU6050 Aktif</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Status Server</CardTitle>
            <Activity className='h-4 w-4 text-green-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>99.9%</div>
            <p className='text-xs text-muted-foreground'>Uptime API & Data</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

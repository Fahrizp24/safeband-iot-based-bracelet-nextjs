'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('customer@example.com');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false
    });
    setLoading(false);
    
    if (res?.error) {
      toast.error('Gagal login: Kredensial tidak valid');
    } else {
      toast.success('Login berhasil');
      router.push('/dashboard/overview');
    }
  };

  return (
    <div className='flex min-h-screen font-sans antialiased bg-white'>
      {/* LEFT PANE - SHOWCASE/MOCKUP (Hidden on small screens) */}
      <div className='relative hidden w-1/2 flex-col items-center justify-center bg-slate-900 overflow-hidden lg:flex'>
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center w-full px-12">
           <img 
              src="/assets/mockup item.png" 
              alt="SafeBand Mockup" 
              className="w-full max-w-lg object-contain drop-shadow-2xl opacity-95 transition-transform hover:scale-105 duration-700 rounded-lg"
            />
           <div className="mt-12 text-center">
             <h2 className="text-3xl font-bold text-white tracking-tight">Teknologi Perlindungan Real-time</h2>
             <p className="mt-4 text-slate-400 text-lg max-w-md mx-auto">
               Desain elegan, baterai tahan lama, dan sensor MPU6050 presisi tinggi yang menjamin keluarga Anda aman kapan saja.
             </p>
           </div>
        </div>

        {/* Subtle branding at bottom left */}
        <div className="absolute bottom-6 left-8 flex items-center gap-2 opacity-60">
           <img src="/assets/Logo lighy.png" alt="in" className="h-6 filter brightness-0 invert" />
           <span className="text-white text-sm font-semibold tracking-wider uppercase">SafeBand Ecosystem</span>
        </div>
      </div>

      {/* RIGHT PANE - FORM SECTION */}
      <div className='flex w-full flex-col justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:px-20 xl:px-32 bg-white'>
        <div className="mx-auto w-full max-w-md">
          {/* Logo only for mobile, visible on desktop as nice touch */}
          <Link href="/" className="mb-8 block max-w-fit hover:opacity-80 transition-opacity">
            <img 
              src="/assets/logo with my brand name.png" 
              alt="SafeBand Brand" 
              className="h-10 w-auto object-contain"
            />
          </Link>
          
          <h1 className='mt-6 text-3xl font-extrabold tracking-tight text-slate-900'>Selamat Datang Kembali</h1>
          <p className='mt-2 text-sm text-slate-500'>
            Masuk untuk memonitor data keselamatan perangkat Anda.
          </p>

          <div className="mt-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className='space-y-2'>
                <Label htmlFor='email' className="text-sm font-semibold text-slate-700">Alamat Email</Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='nama@contoh.com'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-50 border-slate-200 focus-visible:ring-blue-600 rounded-xl px-4 py-6 text-base"
                  required
                />
              </div>
              <div className='space-y-2'>
                <div className="flex items-center justify-between">
                  <Label htmlFor='password' className="text-sm font-semibold text-slate-700">Password</Label>
                  <a href="#" className="font-medium text-sm text-blue-600 hover:text-blue-500">Lupa password?</a>
                </div>
                <Input
                  id='password'
                  type='password'
                  placeholder='••••••••'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-50 border-slate-200 focus-visible:ring-blue-600 rounded-xl px-4 py-6 text-base"
                  required
                />
              </div>

              <Button type='submit' className='w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 text-base font-semibold shadow-md active:scale-[0.98] transition-transform' disabled={loading}>
                {loading && <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />}
                Masuk ke Dashboard
              </Button>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-slate-500 font-medium">Atau gunakan pihak ketiga</span>
                </div>
              </div>

              <div className="mt-6">
                <Button 
                  type='button' 
                  variant='outline' 
                  className='w-full rounded-xl bg-white border-slate-200 hover:bg-slate-50 hover:text-slate-900 font-semibold h-12 active:scale-[0.98] transition-transform shadow-sm' 
                  onClick={() => signIn('google', { callbackUrl: '/dashboard/overview' })}
                >
                  <svg className="mr-3 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                  Masuk dengan akun Google
                </Button>
              </div>
            </div>

            <p className='mt-10 text-center text-sm text-slate-600'>
              Belum punya koneksi alat SafeBand?{' '}
              <Link href='/auth/register' className='font-semibold text-blue-600 hover:text-blue-500 transition-colors'>
                Daftar sekarang
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

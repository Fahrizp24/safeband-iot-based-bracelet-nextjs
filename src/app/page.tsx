import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Shield, Activity, BatteryCharging, Waves, HeartPulse, CheckCircle2, Zap, MapPin, Bell } from 'lucide-react';

export const metadata: Metadata = {
  title: 'SafeBand - Smart Fall Detection',
  description: 'Gelang pintar pelacak dan deteksi jatuh untuk pemantauan lansia secara real-time.',
};

export default function LandingPage() {
  return (
    <div className='flex flex-col min-h-screen font-sans antialiased text-slate-900 selection:bg-blue-100 selection:text-blue-900'>
      {/* HEADER */}
      <header className='px-6 lg:px-12 py-5 flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50'>
        <div className='flex items-center gap-2'>
          <img 
            src="/assets/logo with my brand name.png" 
            alt="SafeBand Brand" 
            className="h-8 md:h-10 w-auto object-contain"
          />
        </div>
        <nav className='flex items-center gap-6'>
          <Link href='/auth/login' className='text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-wider'>
            Log In
          </Link>
          <Link href='/auth/register' className='text-sm font-semibold bg-slate-900 text-white px-5 py-2.5 rounded-full hover:bg-slate-800 transition-all shadow-sm hover:shadow active:scale-95'>
            Daftar Sekarang
          </Link>
        </nav>
      </header>

      <main className='flex-1'>
        {/* HERO SECTION */}
        <section className='relative w-full py-12 md:py-16 lg:py-20 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-blue-50/30'>
          {/* Abstract Background Decoration */}
          <div className="absolute top-0 left-1/2 -ml-[40rem] w-[80rem] max-w-none opacity-50 sm:-ml-[50rem] sm:w-[100rem]">
            <svg viewBox="0 0 1024 1024" className="absolute top-1/2 left-1/2 -z-10 h-[64rem] w-[64rem] -translate-x-1/2 -translate-y-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]" aria-hidden="true">
              <circle cx="512" cy="512" r="512" fill="url(#gradient)" fillOpacity="0.7" />
              <defs>
                <radialGradient id="gradient">
                  <stop stopColor="#DBEAFE" />
                  <stop offset="1" stopColor="#EEF2FF" />
                </radialGradient>
              </defs>
            </svg>
          </div>

          <div className='container px-4 md:px-6 mx-auto relative z-10'>
            <div className='grid lg:grid-cols-2 gap-8 lg:gap-6 items-center'>
              {/* Left: Text */}
              <div className='flex flex-col space-y-5 text-center lg:text-left'>
                <div className="flex items-center justify-center lg:justify-start gap-3 bg-white/60 backdrop-blur border border-blue-100 px-4 py-1.5 rounded-full text-sm font-medium text-blue-800 w-fit mx-auto lg:mx-0 shadow-sm" style={{ animation: 'fadeInUp 0.6s ease-out forwards' }}>
                  <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
                  Sistem Deteksi Jatuh Real-time #1
                </div>
                <div className='space-y-4'>
                  <h1 className='text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-slate-900'>
                    Lindungi Orang Tersayang,<br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"> Kapanpun & Dimanapun.</span>
                  </h1>
                  <p className='max-w-[600px] text-slate-500 md:text-xl/relaxed mt-6 mx-auto lg:mx-0'>
                    Lebih dari sekadar gelang. SafeBand mendeteksi insiden jatuh secara seketika dan langsung memberikan notifikasi darurat kepada orang terdekat.
                  </p>
                </div>
                <div className='flex flex-col sm:flex-row items-center gap-4 pt-2 justify-center lg:justify-start'>
                  <Link href='/auth/register' className='inline-flex items-center justify-center rounded-full text-base font-semibold bg-blue-600 text-white h-12 px-8 shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all w-full sm:w-auto'>
                    Coba SafeBand Gratis <ArrowRight className='ml-2 h-4 w-4' />
                  </Link>
                  <Link href='/auth/login' className='inline-flex items-center justify-center rounded-full text-base font-semibold bg-white border border-slate-200 text-slate-700 h-12 px-8 shadow-sm hover:bg-slate-50 transition-all w-full sm:w-auto'>
                    Akses Dashboard
                  </Link>
                </div>
              </div>

              {/* Right: Product Hero Image */}
              <div className='flex justify-center lg:justify-end relative' style={{ animation: 'fadeInUp 0.8s ease-out 0.2s both' }}>
                <div className="relative">
                  {/* Glow effect behind product */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-200/40 via-cyan-100/30 to-transparent rounded-[3rem] blur-3xl scale-110"></div>
                  <img 
                    src="/assets/item with hand.png" 
                    alt="SafeBand worn on wrist" 
                    className="relative z-10 w-full max-w-lg object-contain drop-shadow-2xl hover:scale-[1.02] transition-transform duration-700 ease-out"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRODUCT SHOWCASE SECTION */}
        <section className='w-full py-12 md:py-20 bg-white relative overflow-hidden'>
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-60"></div>
          
          <div className='container px-4 md:px-6 mx-auto relative z-10'>
            <div className='grid lg:grid-cols-2 gap-10 items-center'>
              {/* Left: Charger Image */}
              <div className='flex justify-center relative order-2 lg:order-1'>
                <div className="relative group">
                  {/* Animated pulse ring */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-200/20 via-blue-100/20 to-transparent rounded-[3rem] blur-2xl scale-105 group-hover:scale-115 transition-transform duration-700"></div>
                  <img 
                    src="/assets/item charger.png" 
                    alt="SafeBand on wireless charger with LED glow" 
                    className="relative z-10 w-full max-w-md object-contain drop-shadow-xl group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                  />
                  {/* Floating badge */}
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20 bg-white/90 backdrop-blur-sm rounded-full px-5 py-2.5 shadow-lg border border-slate-100 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-cyan-500" />
                    <span className="text-sm font-semibold text-slate-700">Wireless Charging</span>
                  </div>
                </div>
              </div>

              {/* Right: Text */}
              <div className='space-y-6 order-1 lg:order-2'>
                <div className="inline-flex items-center gap-2 bg-cyan-50 border border-cyan-100 text-cyan-700 text-sm font-medium px-4 py-1.5 rounded-full">
                  <BatteryCharging className="h-4 w-4" />
                  Teknologi Terbaru
                </div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                  Pengisian Daya<br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">Nirkabel & Cepat</span>
                </h2>
                <p className="text-slate-500 text-lg leading-relaxed max-w-lg">
                  Cukup letakkan SafeBand di atas pad pengisi daya magnetik. LED cyan menandakan pengisian aktif, sehingga perlindungan Anda tidak pernah berhenti — bahkan saat sedang mengisi baterai.
                </p>
                <ul className="space-y-3 pt-2">
                  <li className="flex items-start gap-3 text-slate-600">
                    <CheckCircle2 className="h-5 w-5 text-cyan-500 shrink-0 mt-0.5" />
                    <span>Indikator LED siap pakai secara real-time</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-600">
                    <CheckCircle2 className="h-5 w-5 text-cyan-500 shrink-0 mt-0.5" />
                    <span>Pengisian magnetik otomatis — tanpa kabel rumit</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-600">
                    <CheckCircle2 className="h-5 w-5 text-cyan-500 shrink-0 mt-0.5" />
                    <span>Pantau level baterai langsung dari Dashboard</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section className='w-full py-12 md:py-20 bg-slate-50/80 relative'>
          <div className='container px-4 md:px-6 mx-auto'>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Teknologi Medis di Pergelangan Tangan Anda
              </h2>
              <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
                Didesain khusus untuk memberikan rasa aman tanpa henti, didukung sensor berpresisi tinggi.
              </p>
            </div>

            <div className='grid gap-8 sm:grid-cols-2 lg:grid-cols-3'>
              {/* Card 1 */}
              <div className='group flex flex-col p-8 bg-white rounded-3xl border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50 transition-all duration-500'>
                <div className="h-14 w-14 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center shadow-sm border border-blue-50 mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  <Activity className='h-7 w-7 text-blue-600' />
                </div>
                <h3 className='text-xl font-bold text-slate-900 mb-3'>Sensor MPU6050</h3>
                <p className='text-slate-600 leading-relaxed'>Mendeteksi posisi, akselerasi, dan pergerakan secara real-time dengan algoritma presisi tinggi untuk mencegah false-alarm.</p>
              </div>
              
              {/* Card 2 */}
              <div className='group flex flex-col p-8 bg-white rounded-3xl border border-slate-100 hover:border-amber-200 hover:shadow-xl hover:shadow-amber-50 transition-all duration-500'>
                <div className="h-14 w-14 bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl flex items-center justify-center shadow-sm border border-amber-50 mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  <Bell className='h-7 w-7 text-amber-600' />
                </div>
                <h3 className='text-xl font-bold text-slate-900 mb-3'>Notifikasi Darurat</h3>
                <p className='text-slate-600 leading-relaxed'>Otomatis menerbitkan sinyal SOS darurat (Ticketing System) bila sistem mengenali benturan fisik ekstrem akibat jatuh.</p>
              </div>

              {/* Card 3 */}
              <div className='group flex flex-col p-8 bg-white rounded-3xl border border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-50 transition-all duration-500'>
                <div className="h-14 w-14 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl flex items-center justify-center shadow-sm border border-emerald-50 mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  <MapPin className='h-7 w-7 text-emerald-600' />
                </div>
                <h3 className='text-xl font-bold text-slate-900 mb-3'>Pelacakan Lokasi</h3>
                <p className='text-slate-600 leading-relaxed'>Kirim koordinat GPS secara otomatis saat terdeteksi insiden untuk mempercepat proses pertolongan di lapangan.</p>
              </div>
            </div>
          </div>
        </section>

        {/* WEARABLE SHOWCASE SECTION */}
        <section className='w-full py-12 md:py-20 bg-white relative overflow-hidden'>
          <div className='container px-4 md:px-6 mx-auto'>
            <div className='grid lg:grid-cols-2 gap-10 items-center'>
              {/* Left: Text */}
              <div className='space-y-6'>
                <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full">
                  <HeartPulse className="h-4 w-4" />
                  Desain Ergonomis
                </div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                  Nyaman Dipakai<br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">Sepanjang Hari</span>
                </h2>
                <p className="text-slate-500 text-lg leading-relaxed max-w-lg">
                  SafeBand dirancang dengan material medical-grade silicone yang ringan dan hipoalergenik. Desainnya minimalis dan elegan, sehingga cocok untuk segala usia dan aktivitas sehari-hari.
                </p>
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-2xl font-bold text-blue-600">28g</div>
                    <div className="text-xs text-slate-500 mt-1">Ultra Ringan</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-2xl font-bold text-blue-600">IP67</div>
                    <div className="text-xs text-slate-500 mt-1">Tahan Air</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-2xl font-bold text-blue-600">24/7</div>
                    <div className="text-xs text-slate-500 mt-1">Perlindungan</div>
                  </div>
                </div>
              </div>

              {/* Right: Mockup product */}
              <div className='flex justify-center relative'>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-200/30 via-violet-100/20 to-transparent rounded-[3rem] blur-3xl scale-110 group-hover:scale-120 transition-transform duration-700"></div>
                  <img 
                    src="/assets/mockup item.png" 
                    alt="SafeBand product closeup" 
                    className="relative z-10 w-full max-w-md object-contain drop-shadow-xl group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST SECTION */}
        <section className='w-full py-12 md:py-20 bg-slate-900 text-white relative overflow-hidden'>
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl"></div>

          <div className='container px-4 md:px-6 mx-auto flex flex-col md:flex-row items-center justify-between gap-12 relative z-10'>
            <div className="flex-1 space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Ketenangan Pikiran untuk Seluruh Keluarga</h2>
              <p className="text-slate-400 text-lg max-w-xl">
                Bergabung dengan keluarga lain yang telah mengamankan orang tua mereka menggunakan integrasi penuh Internet of Things kami.
              </p>
              <ul className="space-y-3 pt-4">
                <li className="flex items-center gap-3 text-slate-300"><CheckCircle2 className="h-5 w-5 text-blue-400" /> Log insiden permanen di Firebase</li>
                <li className="flex items-center gap-3 text-slate-300"><CheckCircle2 className="h-5 w-5 text-blue-400" /> Kompatibel dengan Mobile & Web</li>
                <li className="flex items-center gap-3 text-slate-300"><CheckCircle2 className="h-5 w-5 text-blue-400" /> Pelacakan Koordinat Lokasi (GeoPoint)</li>
              </ul>
              <div className="pt-4">
                <Link href='/auth/register' className='inline-flex items-center justify-center rounded-full text-base font-semibold bg-blue-600 text-white h-12 px-8 shadow-lg shadow-blue-900/30 hover:bg-blue-500 hover:-translate-y-0.5 transition-all'>
                  Mulai Sekarang <ArrowRight className='ml-2 h-4 w-4' />
                </Link>
              </div>
            </div>
            <div className="flex-1 flex justify-center py-8">
               <img src="/assets/Logo dark.png" alt="SafeBand Insignia" className="h-48 md:h-64 object-contain brightness-110 filter drop-shadow-2xl opacity-90" />
            </div>
          </div>
        </section>
      </main>
      
      {/* FOOTER */}
      <footer className='py-8 w-full border-t border-slate-100 bg-white'>
        <div className="container px-4 mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 grayscale border-r border-slate-200 pr-4 opacity-70">
            <img src="/assets/logo dark.png" alt="SB" className="h-6" />
          </div>
          <p className='text-sm text-slate-500'>
            © 2026 SafeBand IoT Medical System. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-slate-400">
            <span className="hover:text-slate-900 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-slate-900 cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </div>
      </footer>

      {/* Inline animation styles */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

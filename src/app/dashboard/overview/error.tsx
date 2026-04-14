'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className='flex h-full flex-col items-center justify-center space-y-4'>
      <div className='text-center'>
        <h2 className='text-2xl font-bold'>Terjadi Kesalahan!</h2>
        <p className='text-muted-foreground'>
          Maaf, terjadi kesalahan saat memuat halaman ini.
        </p>
      </div>
      <Button onClick={() => reset()}>Coba Lagi</Button>
    </div>
  );
}

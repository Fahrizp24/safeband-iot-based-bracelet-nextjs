import { NextResponse } from 'next/server';
import { auth } from './auth.edge';

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  
  const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth');
  const isAuthRoute = nextUrl.pathname.startsWith('/auth');
  const isHomeRoute = nextUrl.pathname === '/';

  // Biarkan rute API Auth lewat tanpa gangguan
  if (isApiAuthRoute) return NextResponse.next();

  // Redirect Logged In user dari Login/Home ke Dashboard
  if (isAuthRoute || isHomeRoute) {
    if (isLoggedIn) {
      const role = (req.auth?.user as any)?.role;
      return NextResponse.redirect(
        new URL(role === 'admin' ? '/admin/overview' : '/dashboard/overview', nextUrl)
      );
    }
    return NextResponse.next();
  }

  // Proteksi rute Dashboard/Admin
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/auth/login', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};

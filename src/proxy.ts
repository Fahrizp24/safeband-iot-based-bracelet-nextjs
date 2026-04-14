import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth');
  const isPublicApiRoute = nextUrl.pathname.startsWith('/api/sensor');
  const isAuthRoute = nextUrl.pathname.startsWith('/auth');
  const isHomeRoute = nextUrl.pathname === '/';

  if (isApiAuthRoute || isPublicApiRoute) {
    return NextResponse.next();
  }

  if (isAuthRoute || isHomeRoute) {
    if (isLoggedIn) {
      const role = (req.auth?.user as any)?.role;
      if (role === 'admin') {
        return NextResponse.redirect(new URL('/admin/overview', nextUrl));
      }
      return NextResponse.redirect(new URL('/dashboard/overview', nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/auth/login', nextUrl));
  }

  const role = (req.auth?.user as any)?.role;

  // Role based routing
  if (nextUrl.pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard/overview', nextUrl));
  }
  if (nextUrl.pathname.startsWith('/dashboard') && role !== 'customer') {
    return NextResponse.redirect(new URL('/admin/overview', nextUrl));
  }

  return NextResponse.next();
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};

import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/auth/login'
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as any).role || 'customer';
        token.deviceSn = (user as any).deviceSn || '';
      }
      if (trigger === 'update' && session) {
        token.deviceSn = session.deviceSn ?? token.deviceSn;
        token.role = session.role ?? token.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).deviceSn = token.deviceSn;
      }
      return session;
    }
  },
  providers: [],
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true
} satisfies NextAuthConfig;

export const { auth } = NextAuth(authConfig);

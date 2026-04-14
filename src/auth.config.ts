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
        if (session.deviceSn !== undefined) {
          token.deviceSn = session.deviceSn;
        }
        if (session.role !== undefined) {
          token.role = session.role;
        }
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
  providers: [] // Diisi di auth.ts
} satisfies NextAuthConfig;

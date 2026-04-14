import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"

/**
 * Edge-compatible auth config.
 * This file MUST NOT import firebase or any Node.js-only modules,
 * because it is used by the middleware which runs in Edge Runtime.
 * 
 * The actual Firebase lookups happen in auth.ts via callbacks that
 * only run on the Node.js server.
 */
export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      // Authorize is NOT called in Edge — it runs on the server action / route handler
      // So we provide a stub here. The real authorize logic is in auth.ts
      authorize: async () => {
        // This will be overridden by auth.ts
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as any).role || "customer";
        token.deviceSn = (user as any).deviceSn || "";
      }
      
      // Update session data manually if `update()` is called from client
      if (trigger === "update" && session) {
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
      return session
    }
  },
  pages: {
    signIn: "/auth/login",
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fallback_secret_for_development",
} satisfies NextAuthConfig

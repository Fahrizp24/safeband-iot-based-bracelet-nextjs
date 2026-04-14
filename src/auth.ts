import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { db } from "@/lib/firebase"

import { collection, query, where, getDocs, doc, setDoc, getDoc } from "firebase/firestore"
import { cookies } from "next/headers"

/**
 * Full auth configuration with Firebase (Node.js only).
 * This file imports Firebase and MUST NOT be used in middleware.
 * For middleware, use auth.config.ts instead.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
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
      authorize: async (credentials) => {
        const userEmail = credentials.email as string;
        const userPassword = credentials.password as string;
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", userEmail));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          throw new Error("Akun tidak terdaftar di sistem kami.");
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        // Validasi password (mendukung typo "pasword" sesuai database Anda)
        // Dikonversi ke String untuk mencegah kegagalan jika tersimpan sebagai Angka di Firestore
        const dbPassword = String(userData.password || userData.pasword || userData.Password).trim();
        const inputPassword = String(userPassword).trim();
        
        console.log("=== DEBUG LOGIN ===");
        console.log("Password dari Database:", dbPassword);
        console.log("Password dari Form input:", inputPassword);

        if (dbPassword !== inputPassword) {
          throw new Error("Password yang Anda masukkan salah.");
        }

        return { 
          id: userDoc.id, 
          name: userData.name, 
          email: userData.email, 
          role: userData.role || "customer",
          deviceSn: userData.deviceSn || null
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        let deviceSn = "";
        try {
          const cookieStore = await cookies();
          deviceSn = cookieStore.get("pending_device_sn")?.value || "";
        } catch (e) {
          console.error("Error reading cookie", e);
        }

        const userRef = doc(db, "users", user.email);
        const userSnap = await getDoc(userRef);
        
        // Buat data baru jika login Google pertama kali, atau Load data lama
        if (!userSnap.exists()) {
          (user as any).role = "customer";
          (user as any).deviceSn = deviceSn;
          
          await setDoc(userRef, {
            name: user.name,
            email: user.email,
            role: "customer",
            deviceSn: deviceSn,
            createdAt: new Date().toISOString()
          });

          if (deviceSn) {
            await setDoc(doc(db, "devices", deviceSn), {
              sn: deviceSn,
              userId: user.email,
              ownerName: user.name || "Google User",
              registeredAt: new Date().toISOString(),
              status: "active"
            });
          }
        } else {
          // Jika akun Google sudah ada di DB, tempelkan data aslinya ke token!
          (user as any).role = userSnap.data().role || "customer";
          (user as any).deviceSn = userSnap.data().deviceSn || "";
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      // PERHATIKAN: Jangan memanggil Firebase getDoc di sini! 
      // Karena middleware Next.js berjalan di "Edge Runtime", SDK Firebase akan hang.
      // Cukup simpan data user (yang sudah ditarik di tahap "authorize" atau "signIn") ke token.
      if (user) {
        token.role = (user as any).role || "customer";
        token.deviceSn = (user as any).deviceSn || "";
      }
      
      // Update data session secara manual jika `update()` dipanggil dari client
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
})

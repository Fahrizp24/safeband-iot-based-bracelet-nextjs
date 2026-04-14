import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { db } from "@/lib/firebase"
import { authConfig } from "./auth.edge"
import { collection, query, where, getDocs, doc, setDoc, getDoc } from "firebase/firestore"

import { cookies } from "next/headers"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
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

        const dbPassword = String(userData.password || userData.pasword || userData.Password).trim();
        const inputPassword = String(userPassword).trim();
        
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
    ...authConfig.callbacks,
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
          (user as any).role = userSnap.data().role || "customer";
          (user as any).deviceSn = userSnap.data().deviceSn || "";
        }
      }
      return true;
    },
  },
  basePath: "/api/auth",
})


import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",      type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: credentials.email, password: credentials.password }),
          });
          if (!res.ok) return null;
          const kam = await res.json();
          return { id: String(kam.id), name: kam.name, email: kam.email, kamId: kam.id } as any;
        } catch { return null; }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      if (user && (user as any).kamId) {
        token.kamId = (user as any).kamId;
      }
      if (account?.provider === "google") {
        try {
          const res = await fetch(`${API_URL}/auth/kam-by-email?email=${token.email}`);
          if (res.ok) {
            const kam = await res.json();
            token.kamId = kam.id;
            token.error = null;
          } else {
            token.kamId = null;
            token.error = "not_authorized";
          }
        } catch {
          token.kamId = null;
          token.error = "not_authorized";
        }
      }
      return token;
    },

    async session({ session, token }) {
      (session as any).kamId = token.kamId ?? null;
      (session as any).error = token.error ?? null;
      return session;
    },
  },

  pages: { signIn: "/login" },
};
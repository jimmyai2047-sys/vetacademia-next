import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

// Fail fast if the session secret is missing. Without it NextAuth cannot
// sign/verify session tokens, and silently falling back would be insecure.
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error(
    "NEXTAUTH_SECRET is not configured. Set it in your environment to enable authentication."
  );
}

declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      role?: string;
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    id?: string;
  }
}

const GOOGLE_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const HAS_GOOGLE = Boolean(GOOGLE_ID && GOOGLE_SECRET);

export const authOptions: NextAuthOptions = {
  providers: [
    // P1: Google OAuth is optional — enabled only when env keys are present.
    // When disabled the UI hides the button (see login/signup pages).
    ...(HAS_GOOGLE
      ? [
          GoogleProvider({
            clientId: GOOGLE_ID,
            clientSecret: GOOGLE_SECRET,
            // Keep profile minimal; role is resolved from our DB in signIn callback.
          }),
        ]
      : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        // P2 honeypot: real forms leave it empty; bots fill it.
        company: { label: "Company", type: "text" },
      },
      async authorize(credentials, req) {
        // P2: silently reject bot fills (generic null avoids oracle).
        if (
          typeof (credentials as Record<string, unknown> | undefined)?.company ===
            "string" &&
          ((credentials as Record<string, string>).company as string).trim().length > 0
        ) {
          return null;
        }
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // P0: normalize email so Test@X.com and test@x.com resolve to one account.
        const normalizedEmail = (credentials.email as string).trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
          return null;
        }

        const headers = req.headers as unknown as
          | { get?: (k: string) => string | null }
          | Record<string, unknown>;
        const xff =
          typeof (headers as { get?: unknown }).get === "function"
            ? (headers as { get: (k: string) => string | null }).get("x-forwarded-for")
            : ((headers as Record<string, unknown>)["x-forwarded-for"] as
                | string
                | string[]
                | undefined);
        const clientIp = (Array.isArray(xff) ? xff[0] : (xff as string | undefined) || "unknown")
          .toString()
          .split(",")[0]
          .trim();
        const rl = await rateLimit(`login:${clientIp || "unknown"}`, 10, 60_000);
        if (!rl.allowed) {
          throw new Error("Too many attempts. Please try again in a minute.");
        }

        // P2: per-account brute-force guard (10 attempts / 15 min per email).
        // Counts all attempts — generous for humans, blocks password spraying.
        const acct = await rateLimit(
          `login-acct:${normalizedEmail}`,
          10,
          15 * 60_000
        );
        if (!acct.allowed) {
          throw new Error(
            "Too many attempts for this account. Try again in 15 minutes."
          );
        }

        const user = await prisma.user.findFirst({
          where: { email: { equals: normalizedEmail, mode: "insensitive" } },
        });

        if (!user) {
          return null;
        }

        if (user.banned) {
          // P2: log without PII (id only, no email).
          console.warn(`[auth] blocked login attempt for banned user id=${user.id}`);
          return null;
        }

        // OAuth-only accounts have no password hash — reject credential login.
        if (!user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    // P1: remember-me is handled client-side (prefill). Keep a sane 30-day max.
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    // P1: create/link DB user on first Google sign-in so role gating works.
    async signIn({ user, account }) {
      try {
        if (account?.provider === "google") {
          const email = (user.email || "").trim().toLowerCase();
          if (!email) return false;
          const existing = await prisma.user.findFirst({
            where: { email: { equals: email, mode: "insensitive" } },
          });
          if (existing) {
            if (existing.banned) {
              console.warn(
                `[auth] blocked OAuth login for banned user id=${existing.id}`
              );
              return false;
            }
            user.id = existing.id;
            (user as { role?: string }).role = existing.role;
            return true;
          }
          const created = await prisma.user.create({
            data: {
              name: user.name || email.split("@")[0] || "User",
              email,
              // No password for OAuth accounts — credentials login is rejected.
              password: "",
              role: "STUDENT",
              avatar: user.image || undefined,
              emailVerified: true,
            },
          });
          user.id = created.id;
          (user as { role?: string }).role = created.role;
          return true;
        }
        return true;
      } catch (err) {
        // P2: never log PII (no email).
        console.error("[auth] OAuth signIn callback failed");
        if (process.env.NODE_ENV !== "production") console.error(err);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);

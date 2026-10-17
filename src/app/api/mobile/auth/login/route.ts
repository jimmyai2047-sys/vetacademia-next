import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/mobileAuth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const rl = await rateLimit(`mobile-login:${clientIp(req)}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    }
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Per-account brute-force guard (mirrors web login): 10 attempts / 15 min
    // per email, so password spraying one account from many IPs still stops.
    const acct = await rateLimit(
      `mobile-login-acct:${normalizedEmail}`,
      10,
      15 * 60_000
    );
    if (!acct.allowed) {
      return NextResponse.json(
        { error: "Too many attempts for this account. Try again in 15 minutes." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Banned users must not get a token (web login blocks them too).
    // Generic message so ban status isn't revealed to attackers.
    if (user.banned) {
      console.warn(`[auth] blocked mobile login attempt for banned user id=${user.id}`);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // OAuth-only accounts have no password hash — reject (also avoids a
    // bcrypt crash on the empty hash).
    if (!user.password) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      token: signToken(user.id),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Mobile login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

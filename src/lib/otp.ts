import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const VERIFY_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;
const OTP_LENGTH = 6;

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) {
    throw new Error(
      "NEXTAUTH_SECRET is not configured. Refusing to sign or verify OTPs with a hardcoded fallback secret."
    );
  }
  return s;
}

// Cryptographically-random numeric code (always OTP_LENGTH digits).
export function generateOtp(): string {
  const max = 10 ** OTP_LENGTH;
  const n = crypto.randomInt(0, max);
  return n.toString().padStart(OTP_LENGTH, "0");
}

function hashOtp(code: string): string {
  return crypto
    .createHmac("sha256", secret())
    .update(`otp:${code}`)
    .digest("hex");
}

// Pluggable sender. Today it only logs to the server console (dev mode);
// swap this for an email/SMS provider later without touching the rest.
async function sendOtp(
  contact: string,
  code: string,
  purpose: string
): Promise<void> {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) {
    // No provider configured yet — fail loudly so we never silently skip sending.
    console.warn(
      `[otp] Production sender not configured for purpose=${purpose}. OTP for ${contact} was NOT delivered.`
    );
    return;
  }
  console.log(
    `\n[OTP] purpose=${purpose} contact=${contact} code=${code} (valid ${OTP_TTL_MS / 60000} min)\n`
  );
}

export async function createOtpChallenge(
  contact: string,
  purpose: string,
  ip: string
): Promise<{ ok: boolean; devCode?: string; error?: string }> {
  const rl = rateLimit(`otp:${ip}:${purpose}`, 5, 60_000);
  if (!rl.allowed) {
    return { ok: false, error: "Too many OTP requests. Try again later." };
  }

  const clean = contact.toLowerCase().trim();
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.otpChallenge.deleteMany({ where: { contact: clean, purpose } });
  await prisma.otpChallenge.create({
    data: { contact: clean, purpose, codeHash: hashOtp(code), expiresAt },
  });

  await sendOtp(clean, code, purpose);

  // Surface the code only outside production so the flow is testable.
  return {
    ok: true,
    devCode: process.env.NODE_ENV === "production" ? undefined : code,
  };
}

export type VerifyOtpResult =
  | { ok: true; token: string }
  | { ok: false; error: string };

export async function verifyOtpChallenge(
  contact: string,
  purpose: string,
  code: string
): Promise<VerifyOtpResult> {
  const clean = contact.toLowerCase().trim();
  const challenge = await prisma.otpChallenge.findUnique({
    where: { contact_purpose: { contact: clean, purpose } },
  });

  if (!challenge) {
    return { ok: false, error: "No OTP requested or it has expired." };
  }

  if (challenge.consumed) {
    return { ok: false, error: "This OTP has already been used." };
  }

  if (challenge.expiresAt.getTime() < Date.now()) {
    await prisma.otpChallenge.delete({ where: { id: challenge.id } });
    return { ok: false, error: "OTP expired. Please request a new one." };
  }

  if (challenge.attempts >= MAX_ATTEMPTS) {
    await prisma.otpChallenge.delete({ where: { id: challenge.id } });
    return { ok: false, error: "Too many attempts. Request a new OTP." };
  }

  const expected = hashOtp(code);
  const a = Buffer.from(expected);
  const b = Buffer.from(challenge.codeHash);
  const matches = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!matches) {
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, error: "Invalid OTP." };
  }

  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: { consumed: true },
  });

  return { ok: true, token: signVerificationToken(challenge.id, clean) };
}

// Signed proof that `contact` passed an OTP check for `purpose`. Embedding the
// challenge id lets the register step delete the used challenge (single use).
function signVerificationToken(challengeId: string, contact: string): string {
  const expiry = Date.now() + VERIFY_TOKEN_TTL_MS;
  const payload = Buffer.from(
    `${challengeId}|${contact.toLowerCase()}|${expiry}`
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", secret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyVerificationToken(
  token: string | undefined | null
): { challengeId: string; contact: string } | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;

  const expected = crypto
    .createHmac("sha256", secret())
    .update(payload)
    .digest("base64url");
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let decoded: string;
  try {
    decoded = Buffer.from(payload, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const [challengeId, contact, exp] = decoded.split("|");
  if (!challengeId || !contact || !exp) return null;
  if (Date.now() > Number(exp)) return null;
  return { challengeId, contact: contact.toLowerCase() };
}

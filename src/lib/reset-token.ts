import crypto from "crypto";
import { env } from "./env";

const RESET_TTL_MS = 30 * 60 * 1000; // 30 minutes

function secret(): string {
  const s = env.NEXTAUTH_SECRET;
  if (!s) {
    throw new Error(
      "NEXTAUTH_SECRET is not configured. Refusing to sign or verify reset tokens with a hardcoded fallback secret."
    );
  }
  return s;
}

// Single-use without a DB column: the signature binds the token to the
// account's CURRENT password hash. A successful reset changes the hash, which
// invalidates every previously issued token — so a link can't be replayed.
// OAuth-only accounts have password "" — still binds fine.
export function signResetToken(
  email: string,
  passwordHash: string | null
): string {
  const normalized = email.toLowerCase();
  const expiry = Date.now() + RESET_TTL_MS;
  const payload = Buffer.from(`${normalized}|${expiry}`).toString("base64url");
  const sig = crypto
    .createHmac("sha256", secret())
    .update(`${payload}.${passwordHash ?? ""}`)
    .digest("base64url");
  return `${payload}.${sig}`;
}

// Email claimed by the (still UNVERIFIED) payload — used only to load the
// account so its password hash can verify the signature. Never trusted alone.
export function decodeResetTokenEmail(token: string): string | null {
  const [payload] = token.split(".");
  if (!payload) return null;
  let decoded: string;
  try {
    decoded = Buffer.from(payload, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const [email, exp] = decoded.split("|");
  if (!email || !exp) return null;
  return email.toLowerCase();
}

export function verifyResetToken(
  token: string,
  passwordHash: string | null
): string | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;

  const expected = crypto
    .createHmac("sha256", secret())
    .update(`${payload}.${passwordHash ?? ""}`)
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
  const [email, exp] = decoded.split("|");
  if (!email || !exp) return null;
  if (Date.now() > Number(exp)) return null;
  return email.toLowerCase();
}

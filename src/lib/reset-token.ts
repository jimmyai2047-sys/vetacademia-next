import crypto from "crypto";

const RESET_TTL_MS = 30 * 60 * 1000; // 30 minutes

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) {
    throw new Error(
      "NEXTAUTH_SECRET is not configured. Refusing to sign or verify reset tokens with a hardcoded fallback secret."
    );
  }
  return s;
}

export function signResetToken(email: string): string {
  const expiry = Date.now() + RESET_TTL_MS;
  const payload = Buffer.from(`${email.toLowerCase()}|${expiry}`).toString(
    "base64url"
  );
  const sig = crypto
    .createHmac("sha256", secret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyResetToken(token: string): string | null {
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
  const [email, exp] = decoded.split("|");
  if (!email || !exp) return null;
  if (Date.now() > Number(exp)) return null;
  return email.toLowerCase();
}

import crypto from "crypto";

function getSecret(): string {
  const s = process.env.MOBILE_JWT_SECRET;
  if (!s) throw new Error("MOBILE_JWT_SECRET is not set - refusing to use fallback");
  return s;
}

export function signToken(userId: string): string {
  const SECRET = getSecret();
  const payload = Buffer.from(
    JSON.stringify({
      uid: userId,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
    })
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyToken(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const SECRET = getSecret();
  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("base64url");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(sig, "utf8");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (data.exp && Date.now() > data.exp) return null;
    return data.uid as string;
  } catch {
    return null;
  }
}

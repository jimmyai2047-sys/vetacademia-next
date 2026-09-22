// Single source of truth for password policy (P0: signup required 8, reset required 6 — now unified).
export const PASSWORD_MIN_LENGTH = 8;

export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
};

export function passwordStrength(pw: string): PasswordStrength {
  if (!pw) return { score: 0, label: "Enter a password" };
  let score = 0;
  if (pw.length >= PASSWORD_MIN_LENGTH) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  // Clamp to 0-4 for the 4-segment meter.
  const clamped = Math.min(4, Math.max(0, score > 3 ? 4 : score === 3 ? 3 : score >= 2 ? 2 : score >= 1 ? 1 : 0)) as PasswordStrength["score"];
  const labels = [
    "Too weak",
    "Weak",
    "Fair",
    "Good",
    "Strong",
  ];
  // Empty password handled above; very short passwords are always weak.
  if (pw.length > 0 && pw.length < PASSWORD_MIN_LENGTH) {
    return { score: 1, label: `Use at least ${PASSWORD_MIN_LENGTH} characters` };
  }
  return { score: clamped, label: labels[clamped] };
}

export function validatePassword(pw: string): string | null {
  if (!pw || pw.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  return null;
}

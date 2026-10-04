import { env } from "./env";

// Centralised check for whether Razorpay is configured for *live* payments.
// Used to decide between the test-mode flow and the real Razorpay flow, and to
// block the test-mode "mark paid" shortcut once live keys are present (so users
// cannot bypass real payment).
export function isRazorpayLive(): boolean {
  const keyId = env.RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET;
  return (
    !!keyId &&
    !!keySecret &&
    keyId.startsWith("rzp_") &&
    !keyId.includes("XXXX")
  );
}

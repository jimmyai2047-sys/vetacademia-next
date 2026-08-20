import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { validateCsrf } from "@/lib/csrf";
import { verifyOtpChallenge } from "@/lib/otp";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  code: z
    .string()
    .regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { email, code } = schema.parse(body);

    const result = await verifyOtpChallenge(email, "SIGNUP_EMAIL", code);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      verificationToken: result.token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }
    console.error("Verify OTP error:", error);
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 });
  }
}

import { NextResponse, NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/csrf";
import { verifyVerificationToken } from "@/lib/otp";
import {
  SELF_REGISTERABLE_ROLES,
  ANIMAL_OWNER,
  isExpertRole,
} from "@/lib/roles";

const optionalText = z.string().trim().max(200).optional();

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    surname: z.string().trim().max(100).optional(),
    // P0: normalize email (trim + lowercase) so duplicate casing can't create two accounts.
    email: z
      .string()
      .trim()
      .transform((v) => v.toLowerCase())
      .pipe(z.string().email("Invalid email address")),
    password: z.string().min(8, "Password must be at least 8 characters").max(128),
    role: z
      .string()
      .transform((v) => v.toUpperCase())
      .pipe(
        z
          .string()
          .refine(
            (v) =>
              (SELF_REGISTERABLE_ROLES as readonly string[]).includes(v),
            {
              message: "Invalid or unauthorized role",
            }
          )
      )
      .default("STUDENT"),
    programme: optionalText,
    year: optionalText,
    institution: optionalText,
    phone: z.string().trim().max(30).optional(),
    college: optionalText,
    university: optionalText,
    address: z.string().trim().max(500).optional(),
    highestDegree: optionalText,
    expertDesignation: optionalText,
    subjectDepartment: optionalText,
    specialization: optionalText,
    avatar: z.string().trim().max(1000).optional(),
    // P1: optional email-OTP proof (SIGNUP_EMAIL). If present and valid for this
    // email, the account is marked verified. Absence does NOT block signup.
    emailVerificationToken: z.string().max(2000).optional(),
    // P2: honeypot anti-bot field. Real users leave it empty; bots fill it.
    company: z.string().max(200).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "STUDENT" && !data.programme) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["programme"],
        message: "Programme is required for students",
      });
    }
    if (
      data.role === "STUDENT" &&
      (data.programme === "MVSC" || data.programme === "PHD") &&
      !data.subjectDepartment
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["subjectDepartment"],
        message: "Subject / Department is required",
      });
    }
    if (data.role === ANIMAL_OWNER && !data.address) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["address"],
        message: "Address is required for animal owners",
      });
    }
    if (isExpertRole(data.role)) {
      if (!data.highestDegree)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["highestDegree"],
          message: "Highest Degree is required",
        });
      if (!data.specialization)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["specialization"],
          message: "Specialization is required",
        });
      if (!data.expertDesignation)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["expertDesignation"],
          message: "Role is required",
        });
    }
  });

function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    }

    if (!validateCsrf(req)) {
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 }
      );
    }

    const rl = await rateLimit(`register:${clientIp(req)}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const body = await req.json();
    const validatedData = registerSchema.parse(body);

    // P2: honeypot — silently accept but don't create (avoids telling bots).
    if (validatedData.company && validatedData.company.trim().length > 0) {
      return NextResponse.json(
        { message: "User created successfully", userId: "ok" },
        { status: 201 }
      );
    }

    // Check if user already exists (case-insensitive to catch legacy uppercase rows)
    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: validatedData.email, mode: "insensitive" } },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // P1: validate optional OTP proof. Only marks verified when the token's
    // contact matches this email; never blocks registration on failure.
    let emailVerified = false;
    if (validatedData.emailVerificationToken) {
      const proof = verifyVerificationToken(validatedData.emailVerificationToken);
      if (proof && proof.contact.toLowerCase() === validatedData.email.toLowerCase()) {
        emailVerified = true;
        // Single-use: remove the consumed challenge.
        await prisma.otpChallenge.deleteMany({
          where: { id: proof.challengeId },
        }).catch(() => undefined);
      }
    }

    // P0: only accept avatar URLs from our own Blob store (or relative paths).
    // Prevents SSRF-style profile tricks via arbitrary remote URLs.
    const avatar = validatedData.avatar?.trim() || undefined;
    const avatarOk =
      !avatar ||
      avatar.startsWith("/") ||
      avatar.includes("blob.vercel-storage.com");
    if (!avatarOk) {
      return NextResponse.json(
        { error: "Invalid avatar URL" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        surname: validatedData.surname,
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role,
        programme: validatedData.programme,
        year: validatedData.year,
        institution: validatedData.institution,
        phone: validatedData.phone || undefined,
        college: validatedData.college,
        university: validatedData.university,
        address: validatedData.address,
        highestDegree: validatedData.highestDegree,
        expertDesignation: validatedData.expertDesignation,
        subjectDepartment: validatedData.subjectDepartment,
        specialization: validatedData.specialization,
        avatar,
        emailVerified,
      },
    });

    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    );
    } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues
        .map((i) => i.message)
        .filter(Boolean)
        .join("; ");
      return NextResponse.json(
        { error: message || "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    // P2: don't leak internals/PII in logs or responses.
    console.error("[auth] registration failed");
    if (process.env.NODE_ENV !== "production") console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

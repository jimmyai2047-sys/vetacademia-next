import { NextResponse, NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/csrf";
import {
  SELF_REGISTERABLE_ROLES,
  ANIMAL_OWNER,
  isExpertRole,
} from "@/lib/roles";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    surname: z.string().optional(),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
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
    programme: z.string().optional(),
    year: z.string().optional(),
    institution: z.string().optional(),
    phone: z.string().optional(),
    college: z.string().optional(),
    university: z.string().optional(),
    address: z.string().optional(),
    highestDegree: z.string().optional(),
    expertDesignation: z.string().optional(),
    subjectDepartment: z.string().optional(),
    specialization: z.string().optional(),
    avatar: z.string().optional(),
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

    const rl = rateLimit(`register:${clientIp(req)}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const body = await req.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
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
        phone: validatedData.phone,
        college: validatedData.college,
        university: validatedData.university,
        address: validatedData.address,
        highestDegree: validatedData.highestDegree,
        expertDesignation: validatedData.expertDesignation,
        subjectDepartment: validatedData.subjectDepartment,
        specialization: validatedData.specialization,
        avatar: validatedData.avatar,
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
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

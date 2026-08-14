import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  surname: z.string().optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z
    .string()
    .transform((v) => v.toUpperCase())
    .pipe(z.enum(["STUDENT", "FARMER", "EXPERT"]))
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
});

export async function POST(req: Request) {
  try {
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
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
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

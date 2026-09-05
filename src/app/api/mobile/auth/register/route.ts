import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/mobileAuth";
import { SELF_REGISTERABLE_ROLES } from "@/lib/roles";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.string().optional(),
  programme: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    const email = data.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    const requestedRole = (data.role || "STUDENT").toUpperCase();
    if (!SELF_REGISTERABLE_ROLES.includes(requestedRole)) {
      return NextResponse.json(
        { error: `Role ${requestedRole} cannot be self-registered` },
        { status: 403 }
      );
    }

    const hashed = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email,
        password: hashed,
        role: requestedRole,
        programme: data.programme,
      },
    });

    return NextResponse.json(
      {
        token: signToken(user.id),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues
        .map((i) => i.message)
        .filter(Boolean)
        .join("; ");
      return NextResponse.json(
        { error: message || "Validation failed" },
        { status: 400 }
      );
    }
    console.error("Mobile register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

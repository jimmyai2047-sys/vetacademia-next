"use server";

import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Provisions a brand-new anonymous guest account (role GUEST) and returns its
// credentials so the client can sign in. Each call creates a distinct,
// browse-only user — we never share one seeded account across visitors.
export async function startGuestSession(): Promise<{
  email: string;
  password: string;
}> {
  const email = `guest_${randomUUID()}@vetacademia.com`;
  const password = `${randomUUID()}!`;
  const hashed = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      name: "Guest",
      password: hashed,
      role: "GUEST",
    },
  });

  return { email, password };
}

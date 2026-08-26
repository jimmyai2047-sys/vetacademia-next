"use server";

import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Maximum number of guest users to keep. Older guests beyond this limit
// are deleted on each new guest creation to prevent unbounded DB growth.
const MAX_GUESTS = 500;

export async function startGuestSession(): Promise<{
  email: string;
  password: string;
}> {
  const email = `guest_${randomUUID()}@vetacademia.in`;
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

  // Cleanup: delete oldest guest users if count exceeds limit
  const guestCount = await prisma.user.count({ where: { role: "GUEST" } });
  if (guestCount > MAX_GUESTS) {
    const excess = guestCount - MAX_GUESTS;
    const oldestGuests = await prisma.user.findMany({
      where: { role: "GUEST" },
      orderBy: { createdAt: "asc" },
      take: excess,
      select: { id: true },
    });
    if (oldestGuests.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: oldestGuests.map((g) => g.id) } },
      });
    }
  }

  return { email, password };
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export type AdminSession = NonNullable<Awaited<ReturnType<typeof getServerSession>>>;

// Re-read the user's current role from the DB on every admin request instead of
// trusting the JWT, so demotions/promotions take effect immediately.
async function currentRole(userId?: string): Promise<string | null> {
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role ?? null;
}

export async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = await currentRole(session.user.id);
  if (role !== "ADMIN") return null;
  return session;
}

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const role = await currentRole(session.user.id);
  if (role !== "ADMIN") redirect("/");
  return session;
}


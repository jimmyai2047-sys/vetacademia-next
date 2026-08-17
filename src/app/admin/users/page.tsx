export const metadata = {
  title: "VetAcademia | Users",
};

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UsersClient from "./client";



export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id ?? "";
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      programme: true,
      year: true,
      banned: true,
      createdAt: true,
    },
  });

  return <UsersClient users={users} currentUserId={currentUserId} />;
}

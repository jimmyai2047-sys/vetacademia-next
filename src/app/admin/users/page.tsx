export const metadata = {
  title: "VetAcademia | Users",
};

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UsersClient from "./client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id ?? "";
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [users, totalCount, roleGroups] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
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
    }),
    prisma.user.count(),
    // Whole-dataset role counts — summary cards must never change when the
    // table page changes (admin review finding 6).
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const roleCounts: Record<string, number> = { ALL: totalCount };
  for (const g of roleGroups) roleCounts[g.role] = g._count._all;

  return (
    <UsersClient
      users={users}
      currentUserId={currentUserId}
      page={page}
      totalPages={totalPages}
      totalCount={totalCount}
      roleCounts={roleCounts}
    />
  );
}

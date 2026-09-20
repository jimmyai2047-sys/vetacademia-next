import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSignedUrl } from "@/lib/blob";

// Dashboard: list my generated reports; PAID ones include a fresh download URL.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await prisma.generatedReport.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      animalType: true,
      title: true,
      language: true,
      blobUrl: true,
      amount: true,
      status: true,
      createdAt: true,
    },
  });
  const reports = await Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      animalType: r.animalType,
      title: r.title,
      language: r.language,
      amount: r.amount,
      status: r.status,
      createdAt: r.createdAt,
      downloadUrl: r.status === "PAID" && r.blobUrl ? await getSignedUrl(r.blobUrl) : null,
    }))
  );
  return NextResponse.json({ reports });
}

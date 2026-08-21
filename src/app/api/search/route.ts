import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    if (q.length < 2) return NextResponse.json({ results: [] });

    const like = { contains: q, mode: "insensitive" as const };

    const [materials, papers, experts] = await Promise.all([
      prisma.studyMaterial.findMany({
        where: { isPublic: true, title: like },
        take: 10,
        select: {
          id: true,
          title: true,
          subject: { select: { name: true } },
        },
      }),
      prisma.mockTest.findMany({
        where: { kind: "PREVIOUS_YEAR", title: like },
        take: 10,
        select: { id: true, title: true },
      }),
      prisma.expert.findMany({
        where: { user: { name: like } },
        take: 10,
        select: {
          id: true,
          specialization: true,
          user: { select: { name: true } },
        },
      }),
    ]);

    const results = [
      ...materials.map((m: any) => ({
        type: "material",
        id: m.id,
        title: m.title,
        sub: m.subject?.name ?? "",
        url: `/study-materials/${m.id}`,
      })),
      ...papers.map((p: any) => ({
        type: "paper",
        id: p.id,
        title: p.title,
        sub: "",
        url: `/papers/${p.id}`,
      })),
      ...experts.map((e: any) => ({
        type: "expert",
        id: e.id,
        title: e.user?.name ?? "",
        sub: e.specialization ?? "",
        url: `/experts/${e.id}`,
      })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

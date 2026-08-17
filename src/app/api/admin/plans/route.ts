import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    slug,
    name,
    type,
    price,
    description,
    programmeSlug,
    examSlug,
    year,
    subjectId,
  } = body ?? {};

  if (typeof slug !== "string" || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: "Valid slug (lowercase letters, numbers, hyphens) is required" },
      { status: 400 }
    );
  }
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (type !== "COURSE" && type !== "EXAM") {
    return NextResponse.json(
      { error: "type must be COURSE or EXAM" },
      { status: 400 }
    );
  }
  if (typeof price !== "number" || price < 0) {
    return NextResponse.json(
      { error: "Valid price (number >= 0) is required" },
      { status: 400 }
    );
  }

  const existing = await prisma.plan.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json(
      { error: "A plan with this slug already exists" },
      { status: 409 }
    );
  }

  const maxOrder = await prisma.plan.aggregate({ _max: { sortOrder: true } });

  try {
    const created = await prisma.plan.create({
      data: {
        slug,
        name: name.trim(),
        type,
        price,
        description: typeof description === "string" ? description : null,
        programmeSlug: programmeSlug || null,
        examSlug: examSlug || null,
        year: year || null,
        subjectId: subjectId || null,
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create plan" },
      { status: 500 }
    );
  }
}

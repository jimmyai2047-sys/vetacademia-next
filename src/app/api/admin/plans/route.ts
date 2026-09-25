import { NextResponse, NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { validateCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { parseValidityDays } from "@/lib/plan-validity";

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!validateCsrf(req)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
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
    validityDays,
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
  // validityDays: blank = lifetime; otherwise must be 6, 12 or 24 months.
  const parsed = parseValidityDays(validityDays);
  if (parsed.error) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const validity = parsed.value;

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
        validityDays: validity,
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

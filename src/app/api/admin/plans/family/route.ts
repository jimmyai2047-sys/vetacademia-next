import { NextResponse, NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { validateCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { deriveDurationPrices } from "@/lib/plan-validity";

// Creates a full duration family in one click: lifetime row at `baseSlug`
// plus 6/12/24-month rows at `{baseSlug}-6mo/-12mo/-24mo`, priced at
// 50%/75%/90% of the lifetime anchor (9-ending rounded).
export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
  const {
    baseSlug,
    name,
    type,
    price,
    description,
    programmeSlug,
    examSlug,
    year,
    subjectId,
  } = body ?? {};

  if (typeof baseSlug !== "string" || !/^[a-z0-9-]+$/.test(baseSlug)) {
    return NextResponse.json(
      { error: "Valid baseSlug (lowercase letters, numbers, hyphens) is required" },
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
  if (typeof price !== "number" || price <= 0) {
    return NextResponse.json(
      { error: "Valid lifetime price (number > 0) is required" },
      { status: 400 }
    );
  }

  const tiers = deriveDurationPrices(Math.round(price));

  // Per-month sanity across durations: longer must cost less per month.
  // (Lifetime is a premium anchor and is exempt from the ladder.)
  const durations = tiers.filter((t) => t.validityDays != null);
  const perMonth = durations.map((t) => t.price / (t.validityDays! / 30));
  for (let i = 1; i < perMonth.length; i++) {
    if (perMonth[i] >= perMonth[i - 1]) {
      return NextResponse.json(
        { error: "Derived prices violate per-month ladder — refusing to create" },
        { status: 400 }
      );
    }
  }

  const suffix: Record<string, string> = { lifetime: "", "180": "-6mo", "365": "-12mo", "730": "-24mo" };
  const maxOrder = await prisma.plan.aggregate({ _max: { sortOrder: true } });
  let order = (maxOrder._max.sortOrder ?? 0) + 1;

  const rows = tiers.map((t) => ({
    slug:
      t.validityDays == null ? baseSlug : `${baseSlug}${suffix[String(t.validityDays)]}`,
    name:
      t.validityDays == null ? name.trim() : `${name.trim()} (${t.label})`,
    type,
    price: t.price,
    description:
      typeof description === "string" && description
        ? `${description} Validity: ${t.label.toLowerCase()}.`
        : `Validity: ${t.label.toLowerCase()}. Renews by repurchase.`,
    programmeSlug: programmeSlug || null,
    examSlug: examSlug || null,
    year: year || null,
    subjectId: subjectId || null,
    validityDays: t.validityDays,
    sortOrder: order++,
  }));

  try {
    await prisma.plan.createMany({ data: rows, skipDuplicates: true });
    const created = await prisma.plan.findMany({
      where: { slug: { in: rows.map((r) => r.slug) } },
      orderBy: { price: "asc" },
    });
    return NextResponse.json({ plans: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create plan family" },
      { status: 500 }
    );
  }
  } catch (error) {
    console.error("Plan family create error:", error);
    return NextResponse.json(
      { error: "Failed to create plan family" },
      { status: 500 }
    );
  }
}

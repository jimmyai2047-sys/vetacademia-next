import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const guard = await requireAdminApi(req, { method: "GET" });
  if ("error" in guard) return guard.error;

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(
    200,
    Math.max(1, parseInt(url.searchParams.get("pageSize") || "50", 10) || 50)
  );
  const action = (url.searchParams.get("action") || "").trim();
  const actor = (url.searchParams.get("actor") || "").trim();
  const target = (url.searchParams.get("target") || "").trim();
  const q = (url.searchParams.get("q") || "").trim();
  const from = url.searchParams.get("from") || "";
  const to = url.searchParams.get("to") || "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (action) where.action = { contains: action };
  if (actor) where.actor = { contains: actor };
  if (target) where.target = { contains: target };
  if (from || to) {
    where.createdAt = {};
    if (from) {
      const d = new Date(from);
      if (!isNaN(d.getTime())) where.createdAt.gte = d;
    }
    if (to) {
      const d = new Date(to);
      if (!isNaN(d.getTime())) {
        d.setHours(23, 59, 59, 999);
        where.createdAt.lte = d;
      }
    }
  }
  if (q) {
    where.OR = [
      { action: { contains: q } },
      { actor: { contains: q } },
      { target: { contains: q } },
    ];
  }

  const skip = (page - 1) * pageSize;
  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({
    entries: rows.map((r) => ({
      id: r.id,
      ts: r.createdAt.toISOString(),
      action: r.action,
      actor: r.actor,
      target: r.target,
      meta: (r.meta as Record<string, unknown> | null) ?? undefined,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

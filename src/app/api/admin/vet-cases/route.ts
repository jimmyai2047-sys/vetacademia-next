import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { validateCsrf } from "@/lib/csrf";
import { ok, fail } from "@/lib/api-response";
import { getPagination, pagedResponse } from "@/lib/pagination";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const statusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["OPEN", "REVIEWED", "CLOSED"]),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if ("error" in auth) return auth.error;
  try {
    const { take, skip } = getPagination(req);
    const [total, cases] = await Promise.all([
      prisma.vetCase.count(),
      prisma.vetCase.findMany({
        orderBy: { createdAt: "desc" },
        take,
        skip,
        select: {
          id: true,
          species: true,
          age: true,
          contact: true,
          history: true,
          photoUrls: true,
          status: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
      }),
    ]);
    return ok(pagedResponse(cases, total, take, skip));
  } catch (err) {
    console.error("[admin/vet-cases] GET error:", err);
    return fail("Failed to load cases", 500);
  }
}

export async function PATCH(req: NextRequest) {
  if (!validateCsrf(req)) return fail("Invalid CSRF token", 403);
  const auth = await requireAdminApi(req, { strict: true });
  if ("error" in auth) return auth.error;
  try {
    const parsed = statusSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return fail("Invalid status update", 400);
    const updated = await prisma.vetCase.update({
      where: { id: parsed.data.id },
      data: { status: parsed.data.status },
      select: { id: true, status: true },
    });
    return ok(updated);
  } catch (err) {
    console.error("[admin/vet-cases] PATCH error:", err);
    return fail("Failed to update case", 500);
  }
}

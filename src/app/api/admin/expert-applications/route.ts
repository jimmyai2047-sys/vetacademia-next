import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import type { ExpertApplicationStatus } from "@prisma/client";

// Admin inbox for public expert-proforma submissions.
export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const status = (searchParams.get("status") || "PENDING").toUpperCase();
    const where =
      status === "ALL" ? {} : { status: (["PENDING", "APPROVED", "REJECTED"].includes(status) ? status : "PENDING") as ExpertApplicationStatus };

    const applications = await prisma.expertApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error("Expert applications GET error:", error);
    return NextResponse.json({ error: "Failed to load applications" }, { status: 500 });
  }
}

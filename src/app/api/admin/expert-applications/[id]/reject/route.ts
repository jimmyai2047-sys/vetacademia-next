import { validateCsrf } from "@/lib/csrf";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";

// Reject a proforma application (optionally with a note). Rejected entries
// stay in the inbox for record-keeping and never reach the expert pages.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateCsrf(req)) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  const auth = await requireAdminApi(req, { strict: true });
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;
    const application = await prisma.expertApplication.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const adminNote =
      typeof body.adminNote === "string" && body.adminNote.trim()
        ? body.adminNote.trim().slice(0, 500)
        : null;

    await prisma.expertApplication.update({
      where: { id },
      data: { status: "REJECTED", reviewedAt: new Date(), adminNote },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Expert application reject error:", error);
    return NextResponse.json({ error: "Failed to reject application" }, { status: 500 });
  }
}

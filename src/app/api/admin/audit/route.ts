import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { getAuditLog } from "@/lib/audit";

export async function GET() {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = getAuditLog(200);
  return NextResponse.json(entries);
}

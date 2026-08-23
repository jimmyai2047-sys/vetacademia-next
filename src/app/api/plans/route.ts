import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ plans });
  } catch (error) {
    console.error("Plans API error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

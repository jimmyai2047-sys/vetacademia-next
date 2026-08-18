import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const programme = searchParams.get("programme");
    const department = searchParams.get("department");

    if (programme) {
      const subjects = await prisma.subject.findMany({
        where: {
          programme: {
            name: programme.toUpperCase(),
          },
          ...(department && { departmentId: department }),
        },
        include: {
          department: true,
          programme: true,
          _count: {
            select: { chapters: true },
          },
        },
        orderBy: { name: "asc" },
      });

      return NextResponse.json(subjects);
    }

    // Get all programmes
    const programmes = await prisma.programme.findMany({
      include: {
        _count: {
          select: { subjects: true, departments: true },
        },
      },
    });

    return NextResponse.json(programmes);
  } catch (error) {
    console.error("Curriculum API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

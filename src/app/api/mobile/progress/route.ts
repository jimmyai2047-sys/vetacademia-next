import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/mobileAuth";

export async function GET(req: Request) {
  try {
    const userId = verifyToken(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [attempts, doubts, subjectProgress] = await Promise.all([
      prisma.mockTestAttempt.findMany({ where: { userId } }),
      prisma.doubt.count({ where: { userId } }),
      prisma.userProgress.findMany({
        where: { userId },
        include: { subject: true },
      }),
    ]);

    const totalMarks = attempts.reduce((s, a) => s + a.totalMarks, 0);
    const gained = attempts.reduce((s, a) => s + a.score, 0);
    const avgScore = attempts.length && totalMarks > 0
      ? Math.round((gained / totalMarks) * 100)
      : 0;

    return NextResponse.json({
      mockAttempts: attempts.length,
      avgScore,
      doubts,
      subjectProgress: subjectProgress.map((p) => ({
        subject: p.subject?.name ?? "Subject",
        progress: p.progress,
      })),
    });
  } catch (error) {
    console.error("Progress API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

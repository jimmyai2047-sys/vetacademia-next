import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccess, getAccessForUser } from "@/lib/access";
import { verifyToken } from "@/lib/mobileAuth";
import { programmeNameToSlug } from "@/lib/programme";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");

    if (!subjectId) {
      return NextResponse.json(
        { error: "subjectId is required" },
        { status: 400 }
      );
    }

    const [subject, chapters] = await Promise.all([
      prisma.subject.findUnique({
        where: { id: subjectId },
        select: {
          id: true,
          year: true,
          programme: { select: { name: true } },
        },
      }),
      prisma.chapter.findMany({
        where: { subjectId },
        select: {
          id: true,
          title: true,
          type: true,
          unitNumber: true,
          courseCode: true,
          creditHours: true,
          content: true,
          isDemo: true,
          subjectId: true,
          status: true,
        },
        orderBy: { unitNumber: "asc" },
      }),
    ]);

    // Dual auth: web NextAuth session first, mobile Bearer token fallback
    // (the Android app calls this endpoint with a mobile token).
    let access = await getAccess();
    if (!access.isAuthed) {
      const mobileUserId = verifyToken(req);
      if (mobileUserId) access = await getAccessForUser(mobileUserId);
    }

    // Same gating as the reader page: demo chapters are free, everything
    // else needs a programme / year / subject plan (or admin). Locked
    // chapters return metadata only — content is stripped, never leaked.
    const programmeSlug = subject
      ? programmeNameToSlug(subject.programme.name)
      : "";
    const programmeOwned = programmeSlug
      ? access.programmeSlugs.has(programmeSlug)
      : false;
    const yearOwned =
      (programmeSlug === "bvsc" || programmeSlug === "ahdp") && subject?.year
        ? access.ownedYearScopes.has(`${programmeSlug}:${subject.year}`)
        : false;
    const subjectOwned = subject
      ? access.ownedSubjectIds.has(subject.id)
      : false;

    // Editorial workflow: DRAFT/REVIEW chapters are never listed to learners
    // (admins see everything so they can preview unpublished work).
    const visibleChapters = access.isAdmin
      ? chapters
      : chapters.filter((ch) => ch.status === "PUBLISHED");

    return NextResponse.json(
      visibleChapters.map((ch) => {
        const allowed =
          ch.isDemo ||
          programmeOwned ||
          yearOwned ||
          subjectOwned ||
          access.isAdmin;
        if (allowed) return { ...ch, locked: false };
        const { content, ...meta } = ch;
        return { ...meta, content: "", locked: true };
      })
    );
  } catch (error) {
    console.error("Chapters API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

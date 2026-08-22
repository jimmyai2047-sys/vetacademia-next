import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { prepareChapterHtml } from "@/lib/chapter-images";
import { getAccess } from "@/lib/access";
import { getSignedUrl } from "@/lib/blob";
import { programmeNameToSlug } from "@/lib/programme";
import ReaderPage from "../reader-page";

export const metadata = {
  title: "VetAcademia | Lecture",
};

export default async function LectureRoute({
  params,
}: {
  params: Promise<{ chapterId: string; index: string }>;
}) {
  const { chapterId, index: indexStr } = await params;
  const index = parseInt(indexStr, 10);

  if (isNaN(index) || index < 0) notFound();

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      subject: {
        select: {
          name: true,
          year: true,
          programme: { select: { name: true } },
        },
      },
      chapterContents: true,
      sections: { orderBy: { order: "asc" } },
    },
  });

  if (!chapter) notFound();
  if (chapter.sections.length === 0) notFound();
  if (index >= chapter.sections.length) notFound();

  const access = await getAccess();
  const programmeSlug = programmeNameToSlug(chapter.subject.programme.name);
  const programmeOwned = access.programmeSlugs.has(programmeSlug);
  const yearOwned =
    (programmeSlug === "bvsc" || programmeSlug === "ahdp") && chapter.subject.year
      ? access.ownedYearScopes.has(`${programmeSlug}:${chapter.subject.year}`)
      : false;
  const subjectOwned = access.ownedSubjectIds.has(chapter.subjectId);
  const hasAccess = programmeOwned || yearOwned || subjectOwned;

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdf6ec]">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">Content Locked</h1>
          <p className="text-muted-foreground mb-6">
            Is chapter ko dekhne ke liye enrollment zaroori hai.
          </p>
          <a
            href={`/syllabus/${programmeSlug}/${chapter.subjectId}`}
            className="underline text-primary font-medium"
          >
            ← Syllabus pe wapas jaayein
          </a>
        </div>
      </div>
    );
  }

  const signedHtml = await prepareChapterHtml(chapter.content);

  const preparedSections = await Promise.all(
    chapter.sections.map(async (s) => ({
      id: s.id,
      title: s.title,
      html: await prepareChapterHtml(s.content),
    }))
  );

  const chapterResources = await Promise.all(
    chapter.chapterContents.map(async (c: any) => ({
      ...c,
      url: await getSignedUrl(c.url),
    }))
  );

  const studyMats = await prisma.studyMaterial.findMany({
    where: { chapterId: chapter.id },
    select: {
      id: true,
      title: true,
      url: true,
      fileType: true,
      fileName: true,
    },
  });
  const studyResources = await Promise.all(
    studyMats
      .filter((m: any) => m.url)
      .map(async (m: any) => ({
        id: m.id,
        title: m.title,
        url: await getSignedUrl(m.url),
        fileType: m.fileType,
        fileName: m.fileName || m.title,
        size: null,
      }))
  );

  const resources = [...chapterResources, ...studyResources];

  return (
    <ReaderPage
      title={chapter.title}
      subjectName={chapter.subject.name}
      programmeName={chapter.subject.programme.name}
      programmeSlug={programmeSlug}
      subjectId={chapter.subjectId}
      chapterId={chapter.id}
      author={chapter.author}
      reviewer={chapter.reviewer}
      html={signedHtml}
      sections={preparedSections}
      resources={resources}
      activeSectionIndex={index}
    />
  );
}

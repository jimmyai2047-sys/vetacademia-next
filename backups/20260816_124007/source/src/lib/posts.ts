import { prisma } from "@/lib/prisma";
import { getSignedUrl } from "@/lib/blob";
import { sanitizeChapterContent } from "@/lib/content";

export type PublicPost = {
  id: string;
  title: string;
  content: string | null;
  fileName: string | null;
  fileType: string | null;
  downloadUrl: string | null;
};

export async function getPublishedPosts(
  category: string,
  exam?: string,
  subjectSlug?: string
): Promise<PublicPost[]> {
  const posts = await prisma.post.findMany({
    where: {
      category,
      published: true,
      ...(exam ? { exam } : {}),
      ...(subjectSlug ? { examSubjectSlug: subjectSlug } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  return Promise.all(
    posts.map(async (p) => ({
      id: p.id,
      title: p.title,
      content: p.content ? sanitizeChapterContent(p.content) : null,
      fileName: p.fileName,
      fileType: p.fileType,
      downloadUrl: await getSignedUrl(p.fileUrl),
    }))
  );
}

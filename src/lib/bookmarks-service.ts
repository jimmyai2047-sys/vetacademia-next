import { prisma } from "@/lib/prisma";

// Shared validation + prisma logic for web + mobile bookmark routes.
// Routes remain thin adapters: they keep their own auth (session vs Bearer),
// CSRF, and exact response shapes/status codes. All queries are userId-scoped.

export type ListBookmarksArgs = {
  userId: string;
};

export async function listBookmarks({ userId }: ListBookmarksArgs) {
  return prisma.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export type ToggleBookmarkArgs = {
  userId: string;
  type: string;
  refId: string;
  title: string;
  url: string;
  note?: string | null;
};

// Shared upsert: existing (userId,type,refId) row is updated in place
// (title/url overwritten, note kept unless a new one is given),
// otherwise a new row is created. `created` lets routes preserve their
// exact status codes (200 on update, 201 on create).
export async function toggleBookmark({
  userId,
  type,
  refId,
  title,
  url,
  note,
}: ToggleBookmarkArgs) {
  const existing = await prisma.bookmark.findFirst({
    where: { userId, type, refId },
  });
  if (existing) {
    const bookmark = await prisma.bookmark.update({
      where: { id: existing.id },
      data: { title, url, note: note ?? existing.note },
    });
    return { bookmark, created: false as const };
  }
  const bookmark = await prisma.bookmark.create({
    data: { userId, type, refId, title, url, note: note ?? null },
  });
  return { bookmark, created: true as const };
}

export type RemoveBookmarkArgs = {
  userId: string;
  id: string;
};

// UserId-scoped delete (deleteMany so a foreign id is a silent no-op,
// matching current web + mobile behaviour).
export async function removeBookmark({ userId, id }: RemoveBookmarkArgs) {
  return prisma.bookmark.deleteMany({ where: { id, userId } });
}

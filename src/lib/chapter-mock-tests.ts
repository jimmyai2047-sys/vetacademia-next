// Maps a course's chapter mock tests onto its reader sections (chapters), so a
// test can be rendered "at the end of each chapter" on both the reader and the
// course page. Shared by /reader/[chapterId] and /syllabus/.../[course].

export type ChapterMockTest = {
  id: string;
  title: string;
  duration: number | null;
  totalMarks: number | null;
};

/** "Chapter 4: Adenoviridae" / "Chapter 3 - Morphological Structure..." -> 4 / 3 */
export function chapterNoFromSectionTitle(title: string): number | null {
  const m = title.match(/^\s*chapter\s*[-–—]?\s*0*(\d+)/i);
  return m ? Number(m[1]) : null;
}

/** "VMC 504 Ch-01: Poxviridae - Mock Test (20 MCQs)" -> 1 */
export function chapterNoFromMockTitle(title: string): number | null {
  const m = title.match(/\bch\s*[-–—]?\s*0*(\d+)/i);
  return m ? Number(m[1]) : null;
}

/** "Chapter 4: Adenoviridae" -> "Adenoviridae"; "Chapter 3 - X" -> "X" */
export function chapterTitleWithoutNumber(title: string): string {
  return title.replace(/^\s*chapter\s*[-–—]?\s*\d+\s*[:\-–—]\s*/i, "").trim() || title.trim();
}

/**
 * Returns one entry per section (same order/length), holding the mock test for
 * that chapter or null. Matching is by chapter number first; when every test
 * and every section carries a parseable number the fallback is not needed, but
 * with a 1:1 count we still pair leftovers positionally so nothing is dropped.
 */
export function matchChapterMockTests<T extends ChapterMockTest>(
  tests: readonly T[],
  sectionTitles: readonly string[]
): (T | null)[] {
  const perSection: (T | null)[] = sectionTitles.map(() => null);
  const sectionNos = sectionTitles.map(chapterNoFromSectionTitle);
  const used = new Set<number>();

  tests.forEach((t, ti) => {
    const no = chapterNoFromMockTitle(t.title);
    if (no === null) return;
    const si = sectionNos.findIndex((n, i) => n === no && perSection[i] === null);
    if (si === -1) return;
    perSection[si] = t;
    used.add(ti);
  });

  if (tests.length === sectionTitles.length && tests.length > 0) {
    const free = sectionTitles.map((_, i) => i).filter((i) => perSection[i] === null);
    tests.forEach((t, ti) => {
      if (used.has(ti) || free.length === 0) return;
      perSection[free.shift()!] = t;
      used.add(ti);
    });
  }

  return perSection;
}

import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { sanitizeChapterContent } from "@/lib/content";
import { processInlineImages } from "@/lib/chapter-images";
import mammoth from "mammoth";

function splitHtmlByHeadings(html: string): { title: string; html: string; unitNumber: number }[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const body = doc.body;
  let nodes: Node[] = Array.from(body.childNodes);
  if (body.childElementCount === 1) {
    nodes = Array.from((body.firstElementChild as Element).childNodes);
  }

  const isHeading = (n: Node) =>
    n.nodeType === 1 && /^H[1-4]$/.test((n as Element).tagName);

  const sections: { title: string; nodes: Node[] }[] = [];
  let cur: { title: string; nodes: Node[] } | null = null;

  const flush = () => {
    if (!cur) return;
    sections.push({ title: cur.title, nodes: cur.nodes });
    cur = null;
  };

  nodes.forEach((n) => {
    if (isHeading(n)) {
      flush();
      cur = {
        title: (n as Element).textContent?.trim() || `Unit ${sections.length + 1}`,
        nodes: [],
      };
    } else {
      if (!cur) {
        cur = {
          title: sections.length === 0 ? "Introduction" : `Unit ${sections.length + 1}`,
          nodes: [],
        };
      }
      cur.nodes.push(n);
    }
  });
  flush();

  return sections.map((s, i) => {
    const div = doc.createElement("div");
    s.nodes.forEach((n) => div.appendChild(n));
    return {
      title: s.title,
      html: div.innerHTML,
      unitNumber: i + 1,
    };
  });
}

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileUrl, subjectId, replace } = await req.json();

    if (!fileUrl || typeof fileUrl !== "string") {
      return NextResponse.json({ error: "fileUrl required" }, { status: 400 });
    }
    if (!subjectId || typeof subjectId !== "string") {
      return NextResponse.json({ error: "subjectId required" }, { status: 400 });
    }

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { id: true },
    });
    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    const fileRes = await fetch(fileUrl);
    if (!fileRes.ok) {
      return NextResponse.json({ error: "File download failed" }, { status: 400 });
    }
    const arrayBuffer = await fileRes.arrayBuffer();

    const result = await mammoth.convertToHtml(
      { arrayBuffer },
      { convertImage: mammoth.images.dataUri as any }
    );

    const html = result.value;
    if (!html || html.replace(/<[^>]*>/g, "").trim().length === 0) {
      return NextResponse.json({ error: "File mein content nahi mila" }, { status: 400 });
    }

    const sections = splitHtmlByHeadings(html);
    if (sections.length === 0) {
      return NextResponse.json({ error: "File mein headings nahi mili" }, { status: 400 });
    }

    if (replace) {
      await prisma.chapter.deleteMany({ where: { subjectId } });
    }

    const created = [];
    for (const section of sections) {
      const optimized = await processInlineImages(section.html);
      const chapter = await prisma.chapter.create({
        data: {
          subjectId,
          title: section.title,
          content: sanitizeChapterContent(optimized),
          unitNumber: section.unitNumber,
          type: null,
        },
      });
      created.push(chapter.id);
    }

    return NextResponse.json({ created: created.length }, { status: 201 });
  } catch (error) {
    console.error("DOCX import error:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}

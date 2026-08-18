import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { sanitizeChapterContent } from "@/lib/content";
import { processInlineImages } from "@/lib/chapter-images";
import mammoth from "mammoth";
import { randomUUID } from "crypto";

const chunks = new Map<string, { total: number; received: Map<number, string>; filename: string }>();
const CHUNK_TIMEOUT = 5 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [id, data] of chunks) {
    if (now - parseInt(id.split("-")[0]) > CHUNK_TIMEOUT) chunks.delete(id);
  }
}, 60_000);

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
      cur = { title: (n as Element).textContent?.trim() || `Unit ${sections.length + 1}`, nodes: [] };
    } else {
      if (!cur) cur = { title: sections.length === 0 ? "Introduction" : `Unit ${sections.length + 1}`, nodes: [] };
      cur.nodes.push(n);
    }
  });
  flush();
  return sections.map((s, i) => {
    const div = doc.createElement("div");
    s.nodes.forEach((n) => div.appendChild(n));
    return { title: s.title, html: div.innerHTML, unitNumber: i + 1 };
  });
}

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const action = body.action as string;

    if (action === "init") {
      const filename = body.filename as string;
      const totalChunks = body.totalChunks as number;
      if (!filename || !totalChunks) {
        return NextResponse.json({ error: "filename and totalChunks required" }, { status: 400 });
      }
      const sessionId = `${Date.now()}-${randomUUID().slice(0, 8)}`;
      chunks.set(sessionId, { total: totalChunks, received: new Map(), filename });
      return NextResponse.json({ sessionId });
    }

    if (action === "chunk") {
      const sessionId = body.sessionId as string;
      const index = body.index as number;
      const data = body.data as string;
      const sessionData = chunks.get(sessionId);
      if (!sessionData) {
        return NextResponse.json({ error: "Invalid or expired session" }, { status: 400 });
      }
      sessionData.received.set(index, data);

      if (sessionData.received.size < sessionData.total) {
        return NextResponse.json({ ok: true, received: sessionData.received.size, total: sessionData.total });
      }

      const ordered = Array.from({ length: sessionData.total }, (_, i) => sessionData.received.get(i) || "");
      const base64 = ordered.join("");
      chunks.delete(sessionId);

      const subjectId = body.subjectId as string;
      const replace = body.replace === true;
      const dataUrlMatch = base64.match(/^data:([^;]+);base64,(.+)$/);
      if (!dataUrlMatch) {
        return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
      }
      const b64 = dataUrlMatch[2];
      const arrayBuffer = Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer;

      const subject = await prisma.subject.findUnique({ where: { id: subjectId }, select: { id: true } });
      if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

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

      if (replace) await prisma.chapter.deleteMany({ where: { subjectId } });

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
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Chunked import error:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}

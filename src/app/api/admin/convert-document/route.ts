import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

const ACCEPT = [
  ".docx",
  ".xlsx",
  ".xls",
  ".pdf",
  ".txt",
  ".md",
  ".csv",
  ".html",
  ".htm",
];

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function textToParagraphs(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("\n");
}

// Server-side port of the browser organizeDocxHtml (no DOM available here):
// tag tables and promote short bold-only / ALL-CAPS paragraphs to headings.
function organizeDocxHtml(html: string): string {
  if (!html) return html;
  html = html.replace(/<table\b/gi, '<table class="report-table"');
  html = html.replace(/<p>([\s\S]*?)<\/p>/gi, (full, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "").trim();
    if (!text || text.length > 70) return full;
    const onlyStrong = /^<strong>([\s\S]*?)<\/strong>$/.test(inner.trim());
    const allCaps = /^[A-Z0-9][A-Z0-9 \-/:&]+$/.test(text);
    const looksLikeHeading = onlyStrong || allCaps;
    if (looksLikeHeading && !/[.!?:]$/.test(text)) {
      const level = text.length > 45 ? "h3" : "h2";
      return `<${level}>${inner}</${level}>`;
    }
    return full;
  });
  return html;
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const convertImage = mammoth.images.imgElement((image: any) =>
    image.read("base64").then((data: string) => ({
      src: `data:${image.contentType};base64,${data}`,
      alt: image.alt || "",
    }))
  );
  const result = await (mammoth as any).convertToHtml(
    { buffer },
    {
      styleMap: [
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Subtitle'] => p.report-subtitle:fresh",
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='Quote'] => blockquote:fresh",
        "p[style-name='Caption'] => figcaption:fresh",
      ],
      convertImage,
    }
  );
  const html = organizeDocxHtml(result.value || "");
  return html.trim() || "<p></p>";
}

async function extractXlsx(buffer: Buffer): Promise<string> {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const parts = wb.SheetNames.map((name: string) => {
    const sheet = wb.Sheets[name];
    const table = XLSX.utils.sheet_to_html(sheet);
    return `<h3>${escapeHtml(name)}</h3>\n${table}`;
  });
  const html = parts.join("\n");
  return html.trim() || "<p></p>";
}

async function extractPdf(buffer: Buffer): Promise<string> {
  // pdfjs-dist runs in Node via its legacy build; we extract text only
  // (no canvas needed). Page images are dropped — acceptable server-side
  // tradeoff versus the old client-side canvas rendering.
  const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
  }).promise;
  const parts: string[] = [];
  const MAX_PAGES = 40;
  const pageCount = Math.min(doc.numPages, MAX_PAGES);
  for (let i = 1; i <= pageCount; i++) {
    try {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .map((it: any) => ("str" in it ? it.str : ""))
        .join(" ")
        .trim();
      if (text) parts.push(`<p>${escapeHtml(text)}</p>`);
      page.cleanup();
    } catch (err) {
      console.error("[convert-document] pdf page", i, "failed:", err);
    }
  }
  if (pageCount < doc.numPages) {
    parts.push(
      `<p><em>Showing the first ${pageCount} of ${doc.numPages} pages.</em></p>`
    );
  }
  return parts.join("\n") || "<p></p>";
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file || file.size === 0) {
      return NextResponse.json({ error: "File required" }, { status: 400 });
    }

    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    if (!ACCEPT.includes(ext)) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      );
    }
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max 25 MB)" },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let html: string;

    switch (ext) {
      case ".docx":
        html = await extractDocx(buffer);
        break;
      case ".xlsx":
      case ".xls":
        html = await extractXlsx(buffer);
        break;
      case ".pdf":
        html = await extractPdf(buffer);
        break;
      case ".html":
      case ".htm":
        html = (await file.text()).trim() || "<p></p>";
        break;
      case ".txt":
      case ".md":
      case ".csv":
      default:
        html = textToParagraphs(await file.text());
        break;
    }

    return NextResponse.json({ html });
  } catch (error) {
    console.error("[convert-document] error:", error);
    return NextResponse.json(
      { error: "Conversion failed. Try copy-pasting the text instead." },
      { status: 500 }
    );
  }
}

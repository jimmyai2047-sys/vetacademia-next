/// <reference types="../types/mammoth-browser" />
// Client-only document extraction: turns Excel / Word / PDF (and plain text,
// markdown, csv, html) files into an HTML string that can be stored in the
// project report's demo / full content fields. Parsing libs are loaded lazily
// via dynamic import so they stay out of the normal admin bundle.

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

async function extractDocx(file: File): Promise<string> {
  const mammoth = (await import("mammoth/mammoth.browser.min.js")).default;
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({
    arrayBuffer,
    includeDefaultStyleMap: true,
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
    convertImage: mammoth.images.imgElement((image) =>
      image.read("base64").then((src: string) => ({
        src: `data:${image.contentType};base64,${src}`,
        alt: image.alt || "",
      }))
    ),
  });
  let html = result.value || "";
  html = organizeDocxHtml(html);
  return html.trim() || "<p></p>";
}

// Turn a flat Word export into a structured report. Docs that use direct
// formatting (bolded titles instead of Heading styles) come out as plain
// paragraphs; promote bold-only short paragraphs to headings so the report
// reads as a proper document. Runs in the browser (DOMParser).
function organizeDocxHtml(html: string): string {
  if (typeof window === "undefined" || !html) return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  const body = doc.body;

  body.querySelectorAll("p").forEach((p) => {
    const text = (p.textContent || "").trim();
    if (!text || text.length > 70) return;

    const onlyStrong =
      p.children.length === 1 &&
      p.firstElementChild?.tagName === "STRONG";
    const allCaps = /^[A-Z0-9][A-Z0-9 \-/:&]+$/.test(text);
    const looksLikeHeading = onlyStrong || allCaps;
    // Headings rarely end with sentence punctuation.
    if (looksLikeHeading && !/[.!?:]$/.test(text)) {
      const level = text.length > 45 ? "h3" : "h2";
      const h = doc.createElement(level);
      h.innerHTML = p.innerHTML;
      p.replaceWith(h);
    }
  });

  body.querySelectorAll("table").forEach((t) => t.classList.add("report-table"));

  return body.innerHTML;
}

async function extractXlsx(file: File): Promise<string> {
  const XLSX = await import("xlsx");
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: "array" });
  const parts = wb.SheetNames.map((name: string) => {
    const sheet = wb.Sheets[name];
    const table = XLSX.utils.sheet_to_html(sheet);
    return `<h3>${escapeHtml(name)}</h3>\n${table}`;
  });
  const html = parts.join("\n");
  return html.trim() || "<p></p>";
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Serve the worker locally (copied to /public) so it isn't blocked by the
  // site's Content-Security-Policy (connect-src 'self').
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;

  // Render each page to an image so tables and embedded images are preserved
  // (plain text extraction loses layout and figures). The resulting <img> data
  // URLs are later uploaded to Blob by processInlineImages() on save.
  const MAX_PAGES = 40;
  const pageCount = Math.min(doc.numPages, MAX_PAGES);
  const parts: string[] = [];

  for (let i = 1; i <= pageCount; i++) {
    try {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        page.cleanup();
        continue;
      }
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvas, viewport }).promise;
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      parts.push(
        `<figure class="pdf-page"><img src="${dataUrl}" alt="Page ${i}" loading="lazy" /><figcaption>Page ${i}</figcaption></figure>`
      );
      page.cleanup();
    } catch (err) {
      console.error("extractPdf: failed on page", i, err);
    }
  }

  if (pageCount < doc.numPages) {
    parts.push(
      `<p><em>Showing the first ${pageCount} of ${doc.numPages} pages.</em></p>`
    );
  }

  return parts.join("\n") || "<p></p>";
}

export async function extractDocumentToHtml(file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "").toLowerCase();

  switch (ext) {
    case "docx":
      return extractDocx(file);
    case "xlsx":
    case "xls":
      return extractXlsx(file);
    case "pdf":
      return extractPdf(file);
    case "html":
    case "htm":
      return (await file.text()).trim() || "<p></p>";
    case "txt":
    case "md":
    case "csv":
      return textToParagraphs(await file.text());
    default: {
      // Unknown extension — try plain text, fall back to empty.
      const text = await file.text();
      return text.trim() ? textToParagraphs(text) : "<p></p>";
    }
  }
}

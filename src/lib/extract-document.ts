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
  // @ts-ignore - mammoth browser build has no bundled types
  const mod = await import("mammoth/mammoth.browser.min.js");
  const mammoth = mod.default ?? mod;
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value || "";
  return html.trim() || "<p></p>";
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
  // Run the worker from a CDN pinned to the installed version so the admin
  // bundle doesn't need custom webpack worker config.
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  const paras: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((it: { str?: string }) => it.str ?? "")
      .join(" ");
    if (text.trim()) paras.push(`<p>${escapeHtml(text)}</p>`);
  }
  return paras.join("\n") || "<p></p>";
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

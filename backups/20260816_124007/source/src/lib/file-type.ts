// Shared file-type detection used by admin upload + content routes.
// NOTE: SVG is intentionally NOT treated as IMAGE — uploaded SVGs can carry
// embedded scripts (stored-XSS), so they fall through to "unsupported".

export function detectFileType(fileName: string, mime: string): string | null {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const m = (mime || "").toLowerCase();

  if (m === "application/pdf" || ext === "pdf") return "PDF";
  if (m.includes("presentation") || ["ppt", "pptx", "key"].includes(ext))
    return "PPT";
  if (
    m.includes("word") ||
    m.includes("document") ||
    ["doc", "docx", "txt", "rtf"].includes(ext)
  )
    return "DOC";
  if (
    m.includes("sheet") ||
    m.includes("excel") ||
    ["xls", "xlsx", "csv"].includes(ext)
  )
    return "XLS";
  if (
    m.startsWith("video/") ||
    ["mp4", "webm", "mov", "avi", "mkv"].includes(ext)
  )
    return "VIDEO";
  if (
    m.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "webp"].includes(ext)
  )
    return "IMAGE";
  if (ext === "zip" || ext === "rar" || m.includes("zip")) return "ZIP";
  return null;
}

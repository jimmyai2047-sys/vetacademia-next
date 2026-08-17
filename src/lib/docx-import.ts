export async function importDocxAsHtml(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/convert-docx", {
    method: "POST",
    body: fd,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Word file conversion failed");
  }
  return (data.html as string) || "";
}

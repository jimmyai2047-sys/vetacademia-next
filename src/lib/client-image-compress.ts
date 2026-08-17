const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const JPEG_QUALITY = 0.75;

function isDataUrl(s: string): boolean {
  return s.startsWith("data:image/");
}

function getMimeType(dataUrl: string): string {
  const m = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);/);
  return m ? m[1] : "image/jpeg";
}

export async function compressDataUrl(dataUrl: string): Promise<string> {
  if (!isDataUrl(dataUrl)) return dataUrl;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      const out = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      resolve(out);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export async function compressAllDataUrls(html: string): Promise<string> {
  if (!html || !/data:image\//.test(html)) return html;

  const regex = /<img\b[^>]*\ssrc=["'](data:image\/[^"']+)["'][^>]*>/gi;
  const urls = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) !== null) urls.add(m[1]);
  if (urls.size === 0) return html;

  let out = html;
  for (const dataUrl of urls) {
    const compressed = await compressDataUrl(dataUrl);
    if (compressed !== dataUrl) {
      out = out.split(dataUrl).join(compressed);
    }
  }
  return out;
}

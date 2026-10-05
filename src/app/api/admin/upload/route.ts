import { put } from "@vercel/blob";
import { NextResponse, type NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { getSignedUrl } from "@/lib/blob";
import { logAudit } from "@/lib/audit";
import { detectFileType } from "@/lib/file-type";
import { validateCsrf } from "@/lib/csrf";
import { env } from "@/lib/env";

const MAX_SIZE = 200 * 1024 * 1024; // 200 MB

function hasValidImageMagicBytes(header: Uint8Array): boolean {
  if (header.length < 4) return false;
  // JPEG: FF D8 FF
  if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) return true;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    header.length >= 8 &&
    header[0] === 0x89 &&
    header[1] === 0x50 &&
    header[2] === 0x4e &&
    header[3] === 0x47 &&
    header[4] === 0x0d &&
    header[5] === 0x0a &&
    header[6] === 0x1a &&
    header[7] === 0x0a
  )
    return true;
  // GIF: "GIF87a" / "GIF89a"
  if (
    header.length >= 6 &&
    header[0] === 0x47 &&
    header[1] === 0x49 &&
    header[2] === 0x46 &&
    header[3] === 0x38 &&
    (header[4] === 0x37 || header[4] === 0x39) &&
    header[5] === 0x61
  )
    return true;
  // WebP: "RIFF"...."WEBP"
  if (
    header.length >= 12 &&
    header[0] === 0x52 &&
    header[1] === 0x49 &&
    header[2] === 0x46 &&
    header[3] === 0x46 &&
    header[8] === 0x57 &&
    header[9] === 0x45 &&
    header[10] === 0x42 &&
    header[11] === 0x50
  )
    return true;
  return false;
}

// Vercel Blob store tokens can restrict allowed content types. Some stores
// disallow Office MIME types (.ppt/.pptx/.doc/.xls). If the inferred content
// type is rejected, retry with application/octet-stream which is usually allowed.
async function putWithFallback(
  path: string,
  file: File,
  token?: string,
  access: "private" | "public" = "private"
) {
  const base = {
    access,
    token,
    addRandomSuffix: false,
    multipart: true,
  };
  const contentType =
    file.type && file.type !== "" ? file.type : undefined;
  try {
    return await put(
      path,
      file,
      contentType ? { ...base, contentType } : base
    );
  } catch (e: any) {
    const isContentTypeError =
      e?.name === "BlobContentTypeNotAllowedError" ||
      (typeof e?.message === "string" &&
        e.message.toLowerCase().includes("contenttype") &&
        (e.message.toLowerCase().includes("not allowed") ||
          e.message.toLowerCase().includes("not permitted")));
    if (isContentTypeError) {
      return await put(path, file, {
        ...base,
        contentType: "application/octet-stream",
      });
    }
    throw e;
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "File required" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 200MB)" },
        { status: 400 }
      );
    }

    const fileType = detectFileType(file.name, file.type);
    if (!fileType) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      );
    }

    // detectFileType() only checks extension/MIME (see src/lib/file-type.ts),
    // so verify image magic bytes to reject spoofed uploads (e.g. .exe renamed .jpg).
    if (fileType === "IMAGE") {
      const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
      if (!hasValidImageMagicBytes(header)) {
        return NextResponse.json(
          { error: "Invalid image file (content does not match image type)" },
          { status: 400 }
        );
      }
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `uploads/${Date.now()}-${safeName}`;

    const blob = await putWithFallback(path, file, env.BLOB_READ_WRITE_TOKEN);

    logAudit({
      action: "upload",
      actor: session.user.email,
      target: blob.url,
      meta: { fileType, fileSize: file.size },
    });

    return NextResponse.json(
      {
        url: blob.url,
        downloadUrl: await getSignedUrl(blob.url),
        fileName: file.name,
        fileType,
        fileSize: file.size,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    const message =
      error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

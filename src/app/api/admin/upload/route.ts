import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { getSignedUrl } from "@/lib/blob";
import { logAudit } from "@/lib/audit";
import { detectFileType } from "@/lib/file-type";

const MAX_SIZE = 200 * 1024 * 1024; // 200 MB

// Vercel Blob store tokens can restrict allowed content types. Some stores
// disallow Office MIME types (.ppt/.pptx/.doc/.xls). If the inferred content
// type is rejected, retry with application/octet-stream which is usually allowed.
async function putWithFallback(
  path: string,
  file: File,
  token?: string
) {
  const base = {
    access: "private" as const,
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

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `uploads/${Date.now()}-${safeName}`;

    const blob = await putWithFallback(path, file, process.env.BLOB_READ_WRITE_TOKEN);

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

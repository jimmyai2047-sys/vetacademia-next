import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { getSignedUrl } from "@/lib/blob";
import { logAudit } from "@/lib/audit";
import { detectFileType } from "@/lib/file-type";

const MAX_SIZE = 200 * 1024 * 1024; // 200 MB

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

    const blob = await put(path, file, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
      multipart: true,
    });

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

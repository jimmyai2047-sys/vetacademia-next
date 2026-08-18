import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getSignedUrl } from "@/lib/blob";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "File required" }, { status: 400 });
    }

    const m = (file.type || "").toLowerCase();
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const isImage =
      m.startsWith("image/") ||
      ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);

    if (!isImage) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Image too large (max 5MB)" },
        { status: 400 }
      );
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `avatars/${Date.now()}-${safeName}`;

    const blob = await put(path, file, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
      multipart: true,
    });

    return NextResponse.json(
      {
        url: blob.url,
        downloadUrl: await getSignedUrl(blob.url),
        fileName: file.name,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

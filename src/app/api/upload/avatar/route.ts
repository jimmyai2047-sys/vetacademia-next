import { put } from "@vercel/blob";
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSignedUrl } from "@/lib/blob";
import { validateCsrf } from "@/lib/csrf";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

// Allowed raster image signatures (no SVG — it can carry active scripts).
const MAGIC: Record<string, number[]> = {
  jpg: [0xff, 0xd8, 0xff],
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
  gif: [0x47, 0x49, 0x46],
  webp: [0x52, 0x49, 0x46, 0x46],
};

function hasImageMagic(buf: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buf.slice(0, 4));
  return Object.values(MAGIC).some((sig) =>
    sig.every((b, i) => bytes[i] === b)
  );
}

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 }
      );
    }
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "File required" }, { status: 400 });
    }

    const m = (file.type || "").toLowerCase();
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const isAllowedExt = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
    const isAllowedType = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ].includes(m);

    if (!isAllowedExt || !isAllowedType) {
      return NextResponse.json(
        { error: "Only JPG, PNG, GIF or WEBP images are allowed" },
        { status: 400 }
      );
    }

    const head = await file.slice(0, 4).arrayBuffer();
    if (!hasImageMagic(head)) {
      return NextResponse.json(
        { error: "File content is not a valid image" },
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
    const path = `avatars/${session.user.id}-${Date.now()}-${safeName}`;

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

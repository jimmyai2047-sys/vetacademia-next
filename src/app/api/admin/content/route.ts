import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { getSignedUrl } from "@/lib/blob";
import { detectFileType } from "@/lib/file-type";

const MAX_SIZE = 200 * 1024 * 1024; // 200 MB

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

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const chapterId = form.get("chapterId")?.toString();
    const title = form.get("title")?.toString().trim();
    const file = form.get("file") as File | null;

    if (!chapterId) {
      return NextResponse.json({ error: "chapterId required" }, { status: 400 });
    }
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

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { id: true },
    });
    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `chapter-content/${chapterId}/${Date.now()}-${safeName}`;

    const blob = await putWithFallback(path, file, process.env.BLOB_READ_WRITE_TOKEN);

    const content = await prisma.chapterContent.create({
      data: {
        chapterId,
        title: title || file.name,
        fileType,
        fileName: file.name,
        url: blob.url,
        size: file.size,
        uploadedById: session.user.id ?? null,
      },
    });

    return NextResponse.json(
      { ...content, downloadUrl: await getSignedUrl(blob.url) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const chapterId = searchParams.get("chapterId");
    if (!chapterId) {
      return NextResponse.json({ error: "chapterId required" }, { status: 400 });
    }
    const contents = await prisma.chapterContent.findMany({
      where: { chapterId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(contents);
  } catch (error) {
    console.error("List error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

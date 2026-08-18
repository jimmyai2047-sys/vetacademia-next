import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { getSignedUrl } from "@/lib/blob";

const MAX_SIZE = 200 * 1024 * 1024; // 200 MB

function detectFileType(fileName: string, mime: string): string | null {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const m = (mime || "").toLowerCase();

  if (m === "application/pdf" || ext === "pdf") return "PDF";
  if (
    m.includes("presentation") ||
    ["ppt", "pptx", "key"].includes(ext)
  )
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
    ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)
  )
    return "IMAGE";
  if (ext === "zip" || ext === "rar" || m.includes("zip")) return "ZIP";
  return null;
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

    const blob = await put(path, file, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
      multipart: true,
    });

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

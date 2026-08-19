import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { sanitizeChapterContent } from "@/lib/content";
import { processInlineImages } from "@/lib/chapter-images";
import mammoth from "mammoth";

export const runtime = "nodejs";

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

    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (ext !== "doc" && ext !== "docx") {
      return NextResponse.json(
        { error: "Only .doc / .docx Word files are supported" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Embed images as base64 first; processInlineImages then resizes (max 1200px)
    // + re-encodes to WebP and uploads them to Vercel Blob (private).
    const convertImage = mammoth.images.imgElement(async (image: any) => {
      const data: string = await image.read("base64");
      return { src: `data:${image.contentType};base64,${data}` };
    });

    const result = await mammoth.convertToHtml({ buffer }, { convertImage });

    let html = result.value || "";
    html = await processInlineImages(html);
    html = sanitizeChapterContent(html);

    return NextResponse.json({ html, messages: result.messages || [] });
  } catch (error) {
    console.error("DOCX convert error:", error);
    const message =
      error instanceof Error ? error.message : "Conversion failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

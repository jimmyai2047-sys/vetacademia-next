import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { validateCsrf } from "@/lib/csrf";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { ok, fail } from "@/lib/api-response";
import { put } from "@vercel/blob";
import { sendPushToUser } from "@/lib/push";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SPECIES = [
  "Cattle",
  "Buffalo",
  "Goat / Sheep",
  "Horse",
  "Dog / Cat",
  "Poultry",
] as const;

const bodySchema = z.object({
  species: z.enum(SPECIES),
  age: z.string().max(50).optional().default(""),
  contact: z.string().min(5).max(20),
  history: z.string().min(10).max(2000),
});

const MAGIC: Record<string, number[]> = {
  jpg: [0xff, 0xd8, 0xff],
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return fail("Unauthorized", 401);
    if (!validateCsrf(req)) return fail("Invalid CSRF token", 403);
    const rl = await rateLimit(`vet-case:${clientIp(req)}`, 5, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const form = await req.formData();
    const parsed = bodySchema.safeParse({
      species: form.get("species"),
      age: form.get("age") ?? "",
      contact: form.get("contact"),
      history: form.get("history"),
    });
    if (!parsed.success) {
      return fail("Invalid case details", 400, parsed.error.flatten());
    }

    const files = form
      .getAll("photos")
      .filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length > 3) return fail("Max 3 photos allowed", 400);

    const photoUrls: string[] = [];
    if (files.length > 0) {
      const token = env.BLOB_READ_WRITE_TOKEN;
      if (!token) return fail("Photo uploads are not configured", 503);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          return fail(`Photo ${i + 1} exceeds 5MB`, 400);
        }
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        const mime = (file.type || "").toLowerCase();
        const allowedExt = ["jpg", "jpeg", "png", "gif", "webp"];
        const allowedMime = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        if (!allowedExt.includes(ext) || !allowedMime.includes(mime)) {
          return fail(`Photo ${i + 1} must be JPG, PNG, GIF or WEBP`, 400);
        }
        const head = await file.slice(0, 4).arrayBuffer();
        if (!hasImageMagic(head)) {
          return fail(`Photo ${i + 1} is not a valid image`, 400);
        }
        const blobExt = ext === "jpeg" ? "jpg" : ext;
        const blob = await put(
          `vet-cases/${session.user.id}/${Date.now()}-${i}.${blobExt}`,
          file,
          { access: "private", token }
        );
        photoUrls.push(blob.url);
      }
    }

    const created = await prisma.vetCase.create({
      data: {
        userId: session.user.id,
        species: parsed.data.species,
        age: parsed.data.age || null,
        contact: parsed.data.contact,
        history: parsed.data.history,
        photoUrls,
      },
      select: { id: true },
    });

    // Notify admins (in-app + push). Best-effort: never fail the submission.
    try {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN", banned: false },
        select: { id: true },
      });
      const submitter = session.user.name || session.user.email || "A user";
      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((a) => ({
            userId: a.id,
            title: "New vet case submitted",
            body: `${parsed.data.species} case from ${submitter} needs review.`,
            type: "VET_CASE",
          })),
        });
        await Promise.allSettled(
          admins.map((a) =>
            sendPushToUser(
              a.id,
              "New vet case",
              `${parsed.data.species} case needs review`
            )
          )
        );
      }
    } catch (notifyErr) {
      console.error("[vet-cases] notify error:", notifyErr);
    }

    return ok({ id: created.id }, { status: 201 });
  } catch (err) {
    console.error("[vet-cases] POST error:", err);
    return fail("Failed to submit case", 500);
  }
}

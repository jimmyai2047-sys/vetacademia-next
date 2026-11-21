# Infrastructure & cost rules (read before changing hosting, storage or uploads)

**Project:** VetAcademia — www.vetacademia.in
**Target stack (decided 21 Nov 2026):** Hetzner Cloud CX22 (Singapore) + Cloudflare Free
(CDN/DNS/WAF) + Cloudflare R2 (objects) + Neon Postgres + Upstash Redis + Resend.
**Migrating away from:** Vercel (Hobby team paused for Fluid Active CPU on 18 Nov 2026 →
site returned HTTP 402 until 18 Dec; Blob store suspended for URL signing).

Cost target: **≈ ₹440–600/month**, versus ₹2,080/month for Vercel Pro.
Anything that reintroduces metered egress or per-request media proxying breaks that target.

---

## The three non-negotiable rules

### Rule 1 — Large files never pass through the Next.js server

Uploads go **browser → R2 directly** using a presigned PUT (multipart above ~100 MB).
Downloads and playback use **R2 / Cloudflare URLs directly**.

Never route media through a Next.js route handler. `src/app/api/blob/route.ts` currently
does `Buffer.from(await upstream.arrayBuffer())` — it holds the whole file in memory.
That is tolerable at ~83 KB per chapter image and **fatal at 1 GB per lecture** (OOM,
CPU burn, slow time-to-first-byte). On Vercel this same route was the top Fluid-CPU
consumer; it must not survive into the new stack for anything larger than a thumbnail.

- Keep `/api/blob` only for small, genuinely private assets (reports, proformas) and
  make it **redirect** to a short-lived presigned R2 URL instead of buffering.
- Vercel's serverless body limits are gone on a VPS, but the memory cost is not.
- Presigned URLs must be short-lived (≤ 15 min) and scoped to one operation.

### Rule 2 — Every stored object is served with immutable, long-lived cache headers

On write: `Cache-Control: public, max-age=31536000, immutable` for any content-addressed
or versioned object (chapter UUIDs such as `chapters/0017183d-….webp` already qualify).
Add a Cloudflare Cache Rule for the media hostname so responses are cached at the edge.

Why: R2 egress is free, but edge caching keeps **Class B operations** (10M/month free)
and origin latency down. Cached requests never touch R2 and never bill an operation.
Use a separate hostname for media (e.g. `media.vetacademia.in`) so cache rules and
security headers do not collide with the HTML app.

### Rule 3 — R2 Infrequent Access is never used for hot content

Lecture video, chapter images, book PDFs and anything students read or stream repeatedly
stay in **R2 Standard** ($0.015/GB-month). Infrequent Access ($0.01/GB-month) adds
**$0.01/GB retrieval** plus a 30-day minimum storage duration — strictly worse for content
that is read more than about once a month.

---

## Pricing guardrails (why the rules exist)

- R2 Standard: $0.015/GB-month, 10 GB free, **egress free**, Class B reads $0.36/M
  (10M free). 1 TB of documents ≈ $15/month. Serving them ≈ ₹0.
- Cloudflare Stream: **$5 per 1,000 minutes stored** (≈ $0.30 per lecture-hour **per
  month, idle**) + **$1 per 1,000 minutes delivered** (≈ $0.06 per hour watched).
- Therefore: 100 h of lectures on Stream ≈ **$30/month storage + $60/month at 1,000
  student-hours** ≈ ₹7,900. The same library as HLS on R2 ≈ **$2.25/month**, egress free.

**Video ladder (in order, do not skip):**

1. Documents/images/PPTs → R2. Always.
2. First videos → YouTube *unlisted* embeds (₹0, adaptive quality on Indian mobile).
3. When gating is needed → transcode once with `ffmpeg` on the VPS (720p/480p/360p),
   upload HLS segments to R2, play with `hls.js`. ~20× cheaper than Stream.
4. Stream only for the top 10–20 gated lectures that need DRM/signed playback.
   **Never migrate a whole library to Stream.**

## Current migration state (update this section, do not delete it)

- [ ] Vercel Blob store `J2KwWBlJD9BxCTrN` holds **1,518 objects / 159.95 MB**; inventory at
      `backups/blob-manifest-2026-11-21.json`. Signing is suspended, so bytes cannot be read
      until the Pro upgrade or the 18 Dec 2026 unpause.
- [ ] **Do not delete the Vercel project or the Blob store** until the export to R2 completes.
- [ ] R2 bucket → Hetzner CX22 (Singapore) → Cloudflare DNS → cancel Vercel Pro.
- [ ] Database is Neon `us-east-2` (Ohio). Move the Neon project to Singapore at cutover,
      otherwise every query pays ~230 ms. See `VERCEL-USAGE-AUDIT.md` for the CPU history.
- [ ] `RESEND_API_KEY` is absent from `.env`; password-reset and OTP mail fail soft without it.

## Verification checklist for any future change

- Does it introduce per-GB egress billing? (R2/CDN should make this "no".)
- Does any file > 1 MB pass through a Next.js route handler? (Must be "no".)
- Are new objects written with immutable cache headers? (Must be "yes".)
- Is anything hot sitting in R2 Infrequent Access? (Must be "no".)
- Does the change increase idle video storage on Stream? (Flag it and ask.)

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Infrastructure & cost rules — read before touching hosting, storage or uploads

Full rationale: `docs/infrastructure-and-cost-rules.md`.

Stack: Hetzner CX22 (Singapore) + Cloudflare Free + Cloudflare R2 + Neon + Upstash.
Target cost ≈ ₹440–600/month. Vercel Pro (₹2,080) is being migrated away from after a
Hobby fair-use pause took the site down (HTTP 402) and suspended the Blob store.

**The three rules. Do not violate them without an explicit instruction from the owner.**

1. **Large files never pass through the Next.js server.** Uploads are browser → R2 via
   presigned PUT (multipart above ~100 MB); downloads and playback use direct R2/CDN URLs.
   No `Buffer.from(await res.arrayBuffer())` for media — `src/app/api/blob/route.ts`
   must not handle anything larger than a thumbnail.
2. **Immutable cache headers on every stored object** —
   `Cache-Control: public, max-age=31536000, immutable` for content-addressed keys, plus a
   Cloudflare Cache Rule on the media hostname. Keeps R2 Class B ops and origin latency down.
3. **R2 Infrequent Access is never used for hot content.** Video, chapter images and book
   PDFs stay in R2 Standard; IA adds $0.01/GB retrieval and a 30-day minimum.

**Video ladder:** R2 for documents → YouTube unlisted for early video → self-hosted HLS on
R2 for gated video → Cloudflare Stream only for the top 10–20 lectures. Stream costs
$0.30 per lecture-hour stored per month, so never migrate a library to it.

**Open migration item:** the Blob store (`J2KwWBlJD9BxCTrN`, 1,518 objects / 159.95 MB,
inventory in `backups/blob-manifest-2026-11-21.json`) is suspended for signing. Do not
delete the Vercel project or store until the R2 export completes.

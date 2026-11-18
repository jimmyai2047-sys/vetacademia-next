# Vercel fair-use audit — 18 Nov 2026

## What Vercel actually did

Team **VetAcademia** (Hobby) had **deployments paused** on 18 Nov 2026 for **Fluid Active CPU**.
This is a team-level fair-use pause, not a bad-deploy or bad-commit state:

| Metric | Used | Included | Status |
| --- | --- | --- | --- |
| Fluid Active CPU | 6h 11m | 4h | **over (pause trigger)** |
| Blob Advanced Operations | 2.8K | 2K | **over** |
| Function Invocations | 524K | 1M | under |
| Fast Origin Transfer | 4.94 GB | 10 GB | under |
| CDN Requests | 340K | 1M | under |
| Blob Data Transfer | 1.78 GB | 10 GB | under |
| Image Transformations | 673 | 5K | under |

- The pause ends **18 Dec 2026** (Vercel shows "unpauses in 29d 6h").
- Reverting commits, force-pushing, or deleting deployments does **not** end it.
- **The site is down, not just deploys.** `https://www.vetacademia.in` returns
  HTTP **402** with Vercel's "This deployment is temporarily paused" page
  (checked 18 Nov 2026). The project overview still shows the Oct 29 deployment
  as "Ready", but it is not being served.
- The **Vercel Blob store is also suspended** — the build log shows
  `Vercel Blob: This store has been suspended` for every `getSignedUrl()` call.
  Private blob images/PDFs will fail until the account is restored.
- Only an upgrade to Pro (immediate) or waiting out the window restores service.

Average cost per invocation works out to ~42 ms CPU (6h11m ÷ 524K). That is normal
for a heavy React SSR render, which points at **rendering pages per request**
rather than at one pathological route.

## Root causes, ranked

### 1. The homepage is force-dynamic (biggest single cost)

`src/app/page.tsx` carried `export const dynamic = "force-dynamic"` (added in
`3200876`, 29 Oct). The homepage is the most-visited URL and is ~1,300 lines of
JSX behind `HomePageClient`. Every visit (and every crawl) paid for a full
serverless render + React SSR even though:

- it reads no session, cookies, headers or searchParams;
- its data is already wrapped in `unstable_cache`;
- `proxy.ts` still classifies `/` as a static-CSP path, i.e. the code expected
  it to be static.

### 2. 78 of 97 pages are force-dynamic

Public, identical-for-every-visitor pages were being re-rendered per request,
including pages Googlebot visits constantly (`/blog/[slug]`, `/syllabus`,
`/papers`, `/demo`, `/flashcards`, `/testimonials`, `/vets`).

Pages that genuinely need `force-dynamic` (session/`getAccess`, `searchParams`,
admin) are not the problem — but they were mixed in with the public ones.

### 3. `/api/blob` proxies and buffers whole private files

`src/app/api/blob/route.ts` does, per request: Redis rate-limit → `getServerSession`
→ `getSignedUrl` → `fetch(signed)` → `Buffer.from(await upstream.arrayBuffer())`.
Every blob image/file fetched through it costs a function invocation, a full
download into memory, and a buffered response. Because the URL is auth-bound it
cannot safely be CDN-cached (`Vary: Origin` only, cookies are not in the cache key).

### 4. Blob Advanced Operations overage is token signing

`src/lib/blob.ts` signs a private blob URL (`issueSignedToken` + `presignUrl`)
and caches it **in memory, per serverless instance**. Instances are short-lived,
so the same images are re-signed repeatedly. 2.8K advanced ops / 2K is consistent
with that pattern, not with actual uploads.

### 5. Middleware runs on almost every request

`src/proxy.ts` matcher is `"/((?!_next/static|_next/image|favicon.ico).*)"`, so
`/images/*`, `/logos/*`, `/fonts/*`, `/sw.js`, `/site.webmanifest` and `/api/blob`
all invoke the proxy (nonce generation, header work, a Redis maintenance GET every
10 s per instance). This is Edge Middleware CPU, not Fluid CPU, but it is free to
trim.

## What was changed in this pass

Only where the page provably has no per-request input. `force-dynamic` replaced
with ISR (stale-while-revalidate semantics, so crawl traffic never blocks).

| File | Before | After |
| --- | --- | --- |
| `src/app/page.tsx` | force-dynamic | `revalidate = 600` |
| `src/app/blog/[slug]/page.tsx` | force-dynamic | `revalidate = 600` |
| `src/app/demo/page.tsx` | force-dynamic | `revalidate = 600` |
| `src/app/flashcards/page.tsx` | force-dynamic | `revalidate = 300` |
| `src/app/testimonials/page.tsx` | force-dynamic | `revalidate = 1800` |
| `src/app/vets/page.tsx` | force-dynamic | `revalidate = 900` |
| `src/app/syllabus/page.tsx` | force-dynamic | `revalidate = 900` |
| `src/app/papers/page.tsx` | force-dynamic | `revalidate = 600` |

Deliberately **not** touched:

- `mock-tests/[id]`, `papers/[id]`, `examinations/[exam]/*`, `study-materials/*`,
  `dashboard`, `community`, `consultations`, `checkout`, `pricing`, `prepare` —
  these call `getAccess()` / `getServerSession()` and must stay per-user.
- `books`, `experts`, `live-classes`, `prepare`, `farmers` — they read
  `searchParams`, so they need a client-side filter refactor before they can cache.
- Admin routes.

## Recommended next (not applied)

1. **Move filters client-side** on `/books`, `/experts`, `/live-classes`, then ISR
   them. They are crawlable public pages and currently render per request per filter.
2. **Split gated pages**: render a cached static shell and gate on the client, or
   wrap only the data queries in `unstable_cache` keyed on content (never user) so
   the DB work is cached even when the page stays dynamic.
3. **`/api/blob`**: stream the upstream body instead of buffering (removes the
   per-request full-file copy), or redirect to the presigned URL for consumers that
   follow redirects (Office/Google viewers). Do **not** add `s-maxage` — it is
   session-authenticated.
4. **Blob signing**: persist presigned URLs (Upstash Redis is already wired) or
   lengthen the signed-URL cache, so cold instances stop re-signing every image.
   Making genuinely public images public blobs removes signing entirely.
5. **Trim the proxy matcher** to skip static asset paths and `/api/blob`.
6. **Watch crawler spikes** in Observability; `robots.ts` already blocks AI
   scrapers, but gated pages should also send `noindex` so crawls stop paying for
   renders that cannot rank.
7. If traffic keeps growing, Hobby's 4h Fluid CPU is a low ceiling — Pro is the
   only way to avoid a repeat pause.

## Verification

- `npx tsc --noEmit` — clean.
- `npm run build` — succeeded (`build_audit_check.log`, 136 static pages).
  Route table now shows static/ISR (`○`) for the changed routes (Next takes the
  shortest `revalidate` in the tree, so ISR intervals land at 2–30 min):

  | Route | Before | After |
  | --- | --- | --- |
  | `/` | ƒ | ○ (2m) |
  | `/demo` | ƒ | ○ (10m) |
  | `/flashcards` | ƒ | ○ (5m) |
  | `/papers` | ƒ | ○ (2m) |
  | `/syllabus` | ƒ | ○ (2m) |
  | `/testimonials` | ƒ | ○ (30m) |
  | `/vets` | ƒ | ○ (5m) |
  | `/blog/[slug]` | ƒ | ƒ, but on-demand ISR per slug (no `generateStaticParams`) |

- Build also surfaced the suspended Blob store (see above). That is not caused by
  these edits.
- Nothing is deployed: deployments are paused until 18 Dec 2026.

## What actually restores the site

There is no code, git, or dashboard toggle that unpauses a Hobby fair-use pause.
The two levers are:

1. **Upgrade the team to Pro** — pause is lifted and deploys resume immediately;
   Blob is restored with it. This is the only option that avoids a month of
   downtime.
2. **Wait until 18 Dec 2026** — service resumes automatically when the window
   closes, then the ISR changes above keep usage under the new allowance.

If the site must stay online before December, upgrade is the answer; the code
changes in this pass only reduce the chance of hitting the limit again.

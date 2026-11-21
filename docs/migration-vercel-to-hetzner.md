# Migration runbook — Vercel → Hetzner + Cloudflare + R2

Target: Hetzner CX22 (**Ashburn, US East** until Neon is migrated out of `us-east-2`) +
Cloudflare Free + Cloudflare R2 + Neon + Upstash.
Cost after cutover: **≈ ₹440–600/month** (from ₹2,080).

Rules this migration must preserve: see `docs/infrastructure-and-cost-rules.md`
(large files never through Next.js, immutable cache headers, no R2 Infrequent Access).

Estimated calendar time: **2 evenings** if nothing goes wrong, 3–4 if R2 export is slow.

---

## Progress log (living section — keep current)

| Date | Done | Evidence |
|---|---|---|
| 21 Nov 2026 | Vercel Pro paid → site restored (HTTP 200), Blob signing unlocked | `www.vetacademia.in` 200 |
| 21 Nov 2026 | Full local export: 1,518/1,518 files, 159.95 MB, 0 failures | `media-backup/`, `_export-report-*.json` |
| 21 Nov 2026 | Media copied into R2 `vetacademia-media` (byte-identical, immutable headers) | `backups/r2-export-report-2026-11-21T15-25-57-011Z.json` |
| 21 Nov 2026 | Domain moved to Cloudflare (`art`/`lily.ns.cloudflare.com`), MX/TXT/DKIM intact | `www` returns `cf-ray …-BOM`, MX still resolves |
| 21 Nov 2026 | `media.vetacademia.in` custom domain active; files fetch over HTTPS | 200 + `Cache-Control: immutable` on test objects |
| 21 Nov 2026 | Resend configured and email fixed; production reset mail **Delivered** | see the email section below |

Still open: Hetzner VPS, the 14 `@vercel/blob` call sites → R2, `images.remotePatterns`,
`clientIp()` → `cf-connecting-ip`, staging test, cutover, cancel Vercel Pro. An explicit
Cloudflare Cache Rule for `media.vetacademia.in` is belt-and-braces only — the objects already
carry `immutable` headers.

---

## Phase 0 — Record what must not break (30 min)

### DNS inventory (verified live on 21 Nov 2026)

| Type | Name | Value | Why it matters |
|---|---|---|---|
| MX | `@` | `mx.zoho.in` (10), `mx2.zoho.in` (20), `mx3.zoho.in` (50) | **Zoho Mail**. Lose these and all email stops. |
| TXT | `@` | `v=spf1 include:dc-8e814c8572._spfm.vetacademia.in ~all` | Zoho delegated SPF |
| TXT | `@` | `zoho-verification=zb94036822.zmverify.zoho.in` | Zoho domain verification |
| TXT | `@` | `google-site-verification=nLnI5kpn4ve68Hgi2mFFHRmO8j2vmJDhCRxiBMlCl3o` | Search Console |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;` | Mail policy |
| CNAME | `www` | `9e7a8bea8e2e16be.vercel-dns-017.com` | Current site |
| A | `@` | `216.198.79.1` | Current apex (Vercel) |

### ✅ Email fixed (21 Nov 2026)

**Was broken:** `RESEND_API_KEY` existed nowhere (not Vercel, not local `.env`), so
`src/lib/email.ts` failed soft and password-reset / OTP mail was never generated at all —
while the API still returned `{"success":true}`. On top of that there was no DKIM record and
the SPF authorised only Zoho, so had a key existed, mail would still have failed DMARC
alignment under `p=quarantine`.

**What was done:**

1. New Resend account (`dr.ashokbaindha13@gmail.com`), domain `vetacademia.in` added,
   region **Tokyo (`ap-northeast-1`)** — nearest Resend region to India.
2. Three records added to the Cloudflare zone (all **DNS only**, never proxied):
   - TXT `resend._domainkey` → `p=MIGf…IDAQAB` (selector used by Resend Forge)
   - CNAME `rsend` → `rsend-apne1.forge.rmta.net`
   - CNAME `send` → `send.forge.rmta.net`
   Resend's own SPF/MX arrive via these CNAMEs, so the apex Zoho SPF is untouched.
   **Proxied CNAMEs must be avoided:** Cloudflare flattens them to A records and Resend's
   verification fails forever.
3. Resend domain status: **Verified**. API key `vetacademia-production` (*Sending access*)
   saved in `.env` as `RESEND_API_KEY`; `EMAIL_FROM=VetAcademia <no-reply@vetacademia.in>`.
4. Both variables added to Vercel (Production + Preview) and the project redeployed.
5. Verified end-to-end: `POST /api/auth/forgot-password` on the live site → Resend log shows
   **Delivered** for `drashokbaindha@gmail.com`.

Notes for the VPS cutover: `admin@vetacademia.in` and `dr.ashokbaindha13@gmail.com` are
**not** rows in `User` (139 users), so a reset for them returns `{"success":true}` without
sending. The endpoint answers identically for known and unknown addresses by design — it
cannot be used for account enumeration.

### Environment variables

Copy them **from the Vercel dashboard**, not from the local `.env` — the local file is
missing at least `MOBILE_JWT_SECRET` (required in production by `src/lib/mobileAuth.ts`).
`RESEND_API_KEY` was added to the local file during the email fix and must be copied into
the VPS `.env` as well.

```
DATABASE_URL                 NEXTAUTH_URL=https://www.vetacademia.in
NEXTAUTH_SECRET              MOBILE_JWT_SECRET
RAZORPAY_KEY_ID              RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET      ALLOW_TEST_PAYMENTS=false
RESEND_API_KEY               EMAIL_FROM
NEXT_PUBLIC_APP_URL=https://www.vetacademia.in
NEXT_PUBLIC_APP_NAME         GEMINI_API_KEY
UPSTASH_REDIS_REST_URL       UPSTASH_REDIS_REST_TOKEN
R2_ACCOUNT_ID                R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY         R2_BUCKET=vetacademia-media
R2_PUBLIC_BASE_URL=https://media.vetacademia.in
```

---

## Phase 1 — Cloudflare account and DNS (45 min, no downtime)

DNS is at GoDaddy (`ns07/ns08.domaincontrol.com`). Moving nameservers is safe if the
records are recreated **first**.

1. Create a Cloudflare account → **Add a site** → `vetacademia.in` → Free plan.
2. Cloudflare scans existing records. **Verify every row of the Phase 0 table exists.**
   If MX/TXT are missing, add them by hand before continuing. This is the only step that
   can take your email down.
3. Recreate the site records:
   - `www` → **A** `203.0.113.10` (placeholder for the VPS IP; **Proxied** 🟠)
   - `vetacademia.in` → **A** same IP, **Proxied** 🟠
   - `media` → later, in Phase 2
4. Cloudflare gives you two nameservers. At GoDaddy: **Nameservers → Change →
   Custom** → paste both. Propagation is usually under an hour.
5. Checkpoint: `Resolve-DnsName vetacademia.in -Type NS` shows `*.ns.cloudflare.com`,
   and the site still loads (still served by Vercel until Phase 7).

### Settings to turn on now

| Setting | Value |
|---|---|
| SSL/TLS mode | **Full (strict)** — after installing the Origin Cert in Phase 4 |
| Always Use HTTPS | On |
| Automatic HTTPS Rewrites | On |
| Brotli | On |
| **Redirect rule** | `hostname eq "vetacademia.in"` → 301 to `concat("https://www.vetacademia.in", http.request.uri.path)` |
| **WAF skip rule** | skip Bot Fight/challenges for `/api/payments/webhook` and `/api/mobile/*` (Razorpay and the app must not be challenged) |

Never add an apex→www redirect inside `next.config.ts` — the file itself warns that it
creates a loop. Edge only.

---

## Phase 2 — R2 bucket (20 min)

1. **R2 → Create bucket** → `vetacademia-media`, location **APAC**.
2. **Settings → Public access → Custom domain** → `media.vetacademia.in`.
   (Do not use the `r2.dev` URL — it is rate-limited and not for production.)
3. **Manage R2 API Tokens → Create** → permission *Object Read & Write*, scoped to this
   bucket. Save the Access Key ID and Secret.
4. **CORS** (needed for direct browser uploads):
   ```json
   [{
     "AllowedOrigins": ["https://www.vetacademia.in"],
     "AllowedMethods": ["GET", "HEAD", "PUT"],
     "AllowedHeaders": ["*"],
     "ExposeHeaders": ["ETag"],
     "MaxAgeSeconds": 3600
   }]
   ```
5. **Cache Rule** for `media.vetacademia.in/*`: Cache eligible, Edge TTL 1 year,
   Browser TTL override 1 year.

Storage cost: your 160 MB fits the free tier. See the pricing table in
`docs/infrastructure-and-cost-rules.md`.

---

## Phase 3 — Rescue window and export (1–2 h, mostly waiting)

The Blob store cannot sign URLs while the team is paused, so the bytes are unreachable.
You need one month of Pro to get them out.

1. Upgrade **VetAcademia** to Pro ($20 + GST ≈ $23.6). This also restores the live site.
2. Verify signing works:
   ```
   node --env-file=.env -e "import('@vercel/blob').then(async m=>{const s=await m.list({limit:1});const p=new URL(s.blobs[0].url).pathname.slice(1);const t=await m.issueSignedToken({token:process.env.BLOB_READ_WRITE_TOKEN,pathname:p,operations:['get'],validUntil:Date.now()+60000});const r=await m.presignUrl(t,{operation:'get',pathname:p,access:'private'});console.log((await fetch(r.presignedUrl)).status)})"
   ```
   Expect `200`.
3. Export:
   ```
   npm i -D @aws-sdk/client-s3
   node --env-file=.env scripts/export-blob-to-r2.mjs --dry-run     # enumerates 1,518 objects
   node --env-file=.env scripts/export-blob-to-r2.mjs --skip-existing
   ```
   It preserves pathnames, writes immutable cache headers, and verifies every object's
   size after upload. Re-run with `--skip-existing` to resume after any failure.
4. Checkpoint: report shows `copied: 1518, failed: 0`, and
   `backups/blob-manifest-2026-11-21.json` matches the R2 listing count.

---

## Phase 4 — VPS (45 min)

Create **Hetzner Cloud → CX22 → Singapore → Ubuntu 24.04**, add your SSH key.

```
ssh root@<IP>
git clone https://github.com/<you>/vetacademia-next.git /opt/setup
bash /opt/setup/deploy/bootstrap.sh
```

Then:

1. Cloudflare → SSL/TLS → **Origin Server → Create Certificate** (15 years, hosts
   `vetacademia.in`, `*.vetacademia.in`). Save to `/etc/caddy/origin.pem` + `.key`,
   `chown caddy:caddy`, `chmod 600` the key.
2. `install -m 644 /opt/setup/deploy/Caddyfile /etc/caddy/Caddyfile && systemctl reload caddy`
3. Clone the app: `git clone <repo> /srv/vetacademia/repo` (as the `vetacademia` user).
4. Put the production env at `/srv/vetacademia/shared/env`, `chown vetacademia`,
   `chmod 600`. **This is the only copy of your secrets on the box — back it up.**
5. `bash /opt/setup/deploy/deploy.sh main`

Checkpoint: `curl -H 'Host: www.vetacademia.in' http://127.0.0.1:3000/` returns 200, and
`systemctl status vetacademia` is active.

### Data residency note

Your Neon database is in `us-east-2` (Ohio). Until you migrate it, set the Hetzner box
to **Ashburn (US East)** instead of Singapore, or every query pays ~230 ms. Migrating
Neon to Singapore is a `pg_dump`/restore during a maintenance window — do it after the
site is stable, not during cutover.

---

## Phase 5 — Code changes (the only diff this migration needs)

| File | Change |
|---|---|
| `src/lib/blob.ts` | Replace `issueSignedToken`/`presignUrl` with R2 presigned GETs (S3 SigV4) or the public URL for `chapters/`, `avatars/`. Keep the `getSignedUrl(blobUrl)` signature — it already extracts the pathname, so **no database rewrite is needed**. |
| `src/lib/chapter-images.ts` | `put()` from `@vercel/blob` → `PutObjectCommand` to R2, with `CacheControl: public, max-age=31536000, immutable`. |
| `src/app/api/blob/route.ts` | Stop buffering. `307` redirect to a presigned R2 URL (≤15 min). This is rule 1. |
| `src/lib/rate-limit.ts` | `clientIp()` → prefer `cf-connecting-ip`; behind Cloudflare every request otherwise looks like one IP and the limiter throttles real students. |
| `src/lib/env.ts` | Add `R2_*` accessors. |
| `next.config.ts` | Add `media.vetacademia.in` to `images.remotePatterns`; drop the Blob hosts once the export is verified. |
| `.env` / `.env.example` | Add `R2_*`; remove `BLOB_READ_WRITE_TOKEN` after go-live. |

Nothing else in the app is Vercel-specific. `fs` reads in `src/lib/pdf-static-assets.ts`
keep working (that is the whole reason this stack was chosen).

---

## Phase 6 — Pre-cutover test (30 min)

Do **not** flip `www` yet.

1. Add a temporary record: `staging` → A → VPS IP, **DNS only** (grey cloud).
2. Add `staging.vetacademia.in` to the Caddyfile, reload Caddy.
3. Put `https://staging.vetacademia.in` in `NEXTAUTH_URL` **temporarily**, restart, and test:
   - homepage, `/blog/[slug]`, `/syllabus`, `/papers`
   - login, signup OTP, password reset (this proves the email fix)
   - a gated page (mock test), a Razorpay test payment if using test keys
   - report PDF generation — confirm Devanagari renders (fonts load from disk)
   - an admin chapter upload → object appears in R2 with `immutable` headers
4. Restore the real `NEXTAUTH_URL` before cutover.

---

## Phase 7 — Cutover (5 min, reversible in 5 min)

Because `www` is proxied, there is **no TTL wait** — the change is instant.

1. Edit the `www` A record → VPS IP. Keep it Proxied.
2. Purge Cloudflare cache (Caching → Purge Everything).
3. Watch: `journalctl -u vetacademia -f` and `tail -f /srv/vetacademia/shared/logs/caddy-access.log`.
4. Test the same list as Phase 6 against `https://www.vetacademia.in`.

Rollback: change the `www` A record back to `9e7a8bea8e2e16be.vercel-dns-017.com` (or
Vercel's IP) and purge cache. **Keep Pro alive for a week** so this remains possible.

---

## Phase 8 — Decommission Vercel (after 7 clean days)

1. Confirm no `blob.vercel-storage.com` URLs are still served (grep the DB / check logs).
2. Downgrade VetAcademia to Hobby, then **delete the Blob store only after** the R2
   report and a spot-check download succeed.
3. Delete the Vercel project.
4. Set up backups:
   - Hetzner weekly snapshot (~₹10/month for 40 GB)
   - `pg_dump` → R2 weekly (Neon free tier has limited PITR)
   - R2 object versioning on `reports/` and `expert-proforma/`

---

## Cost after cutover

| Item | Monthly |
|---|---|
| Hetzner CX22 | ≈ €4.6 → **₹440** |
| Cloudflare Free (DNS/CDN/WAF) | **₹0** |
| R2 (160 MB, < 10 GB free) | **₹0** |
| Neon Postgres | ₹0 (free tier) |
| Upstash Redis + Resend | ₹0 (free tiers) |
| **Total** | **≈ ₹440–500** |

One-time: ~₹2,050 for the Pro rescue month (cancel before renewal).

## Failure modes to expect

| Symptom | Cause | Fix |
|---|---|---|
| 502 from Caddy | app not listening | `systemctl status vetacademia`, `journalctl -u vetacademia -n 100` |
| Site loads, images 403 | `R2_PUBLIC_BASE_URL` or CORS wrong | check the `media` hostname and the bucket's custom domain |
| Every request rate-limited | `clientIp()` not reading `cf-connecting-ip` | Phase 5 change |
| Redirect loop | apex→www added in `next.config.ts` | remove it; keep it in Cloudflare |
| Login redirects to localhost | `NEXTAUTH_URL` stale | set `https://www.vetacademia.in`, restart |
| Emails not arriving | SPF/DKIM not verified | Phase 0 email fix |
| Build OOMs | 4 GB box, no swap | `bootstrap.sh` adds 2 GB swap; `NODE_OPTIONS=--max-old-space-size=3072` |

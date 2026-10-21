# VetAcademia - Deployment Guide

## 1. PostgreSQL Setup (Optional - for Production)

### Step 1: Create Database
```sql
-- PostgreSQL mein login karo (password ke saath)
psql -U postgres

-- Database banao
CREATE DATABASE vetacademia;

-- User banao (optional)
CREATE USER vetadmin WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE vetacademia TO vetadmin;
```

### Step 2: .env Update
```env
DATABASE_URL="postgresql://vetadmin:your_secure_password@localhost:5432/vetacademia"
```

### Step 3: Schema Update
`prisma/schema.prisma` mein:
```prisma
datasource db {
  provider = "postgresql"  // sqlite ki jagah postgresql
}
```

### Step 4: Run Migration
```bash
npx prisma migrate dev --name init
npx prisma generate
npx tsx prisma/seeds/seed.ts
npm run seed:demo   # optional: /demo preview content (runs after main seed)
```

---

## 2. Razorpay Setup

### Step 1: Account Banao
1. https://razorpay.com pe jao
2. **Sign Up** karo
3. Business details complete karo
4. PAN aur bank details do

### Step 2: Test Keys Lo
1. Dashboard mein **Settings > API Keys** pe jao
2. **Generate Test Key** click karo
3. Copy karo:
   - `rzp_test_XXXXXXXXXXXXXXX` (Key ID)
   - `XXXXXXXXXXXXXXXXXXXXXXXX` (Key Secret)

### Step 3: .env mein Daalo
```env
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
```

### Step 4: Webhook Configure Karo (Live payments ke liye zaroori)
1. Razorpay Dashboard mein **Settings > Webhooks** pe jao
2. **Add New Webhook** click karo
3. URL: `https://your-app.vercel.app/api/payments/webhook`
4. Secret: ek naya random string banao (alag KEY_SECRET se)
5. Events: `payment.captured`, `payment.failed`, `order.paid` select karo
6. Yehi secret `RAZORPAY_WEBHOOK_SECRET` mein daalo

Webhook isliye zaroori hai kyunki kabhi-kabhi client verify call miss ho
jati hai — webhook server-side payment ko PAID mark karta hai. Agar webhook
secret set na ho to app post-checkout reconcile se bhi payment unlock karta
hai, lekin failure/dispute events miss ho sakte hain.

### Step 5: Test Card Details
| Card Number | Expiry | CVV | Result |
|-------------|--------|-----|--------|
| 4111 1111 1111 1111 | Any future | Any | Success |
| 4000 0000 0000 0002 | Any future | Any | Failure |

---

## 3. Vercel Deployment

### Step 1: GitHub pe Push Karo
```bash
cd "D:\VetAcademia (VA)\vetacademia-next"
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/vetacademia-next.git
git push -u origin main
```

### Step 2: Vercel pe Import Karo
1. https://vercel.com pe jao
2. **Sign Up with GitHub**
3. **Import Project** click karo
4. Apna repo select karo
5. **Deploy** click karo

### Step 3: Environment Variables Set Karo
Vercel Dashboard > Settings > Environment Variables:

| Key | Value |
|-----|-------|
| DATABASE_URL | postgresql://... |
| NEXTAUTH_SECRET | your-super-secret-key |
| NEXTAUTH_URL | https://your-app.vercel.app |
| RAZORPAY_KEY_ID | rzp_test_... |
| RAZORPAY_KEY_SECRET | ... |
| RAZORPAY_WEBHOOK_SECRET | from Razorpay > Settings > Webhooks |
| NEXT_PUBLIC_APP_URL | https://your-app.vercel.app |
| RESEND_API_KEY | re_xxx (from resend.com) |
| EMAIL_FROM | VetAcademia <no-reply@vetacademia.in> |

### Step 3b: Email Setup (Resend) — password reset / OTP
Bina `RESEND_API_KEY` ke reset/OTP mails silently skip ho jate hain (fail-soft).
1. https://resend.com pe sign up (free: 3,000 mails/month)
2. **Domains** pe jao -> apna domain (vetacademia.in) add karo
3. Diye gaye **DKIM/SPF DNS records** apne domain registrar par add karo
4. Domain **Verified** hone do
5. **API Keys** -> Create -> copy `re_...` key
6. Vercel env mein `RESEND_API_KEY` + `EMAIL_FROM` set karo (verified domain wala sender)
7. Redeploy

> Testing ke liye `EMAIL_FROM` Resend ka default `onboarding@resend.dev` use kar
> sakte ho, lekin woh sirf aapke Resend account email tak pahunchega. Real users
> ke liye verified domain wala sender zaroori hai.

### Step 4: Vercel Postgres (Recommended)
Vercel mein free PostgreSQL milta hai:
1. **Storage** tab pe jao
2. **Create Database** > **Postgres** select karo
3. **.env** variables automatically mil jayenge

---

## 4. Domain Connection

### Step 1: Domain Kharido
Recommended registrars:
- **Namecheap** (sasta)
- **GoDaddy** (popular)
- **Google Domains** (simple)

### Step 2: Vercel pe Add Karo
1. Vercel Dashboard > **Settings** > **Domains**
2. Apna domain add karo
3. Instructions follow karo

### Step 3: DNS Settings
Domain registrar pe:

| Type | Name | Value |
|------|------|-------|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

### Step 4: SSL Certificate
Vercel automatically SSL provide karta hai (Let's Encrypt)

---

## Quick Commands

```bash
# Development
npm run dev

# Build
npm run build

# Production Start
npm start

# Database Reset
npx prisma migrate reset

# Seed Database
npx tsx prisma/seeds/seed.ts

# Seed Demo Content (/demo previews — must run AFTER main seed,
# since it reuses the main seed's programme/subject ids)
npm run seed:demo
```

---

## Troubleshooting

### Build Error: Module not found
```bash
npx prisma generate
```

### Database Connection Error
```bash
# Check PostgreSQL service
pg_isready

# Reset password (Admin PowerShell)
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres
ALTER USER postgres PASSWORD 'new_password';
```

### Vercel Deployment Failed
1. Build logs check karo
2. Environment variables verify karo
3. Node version 18+ hona chahiye

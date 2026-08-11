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
```

### Step 4: Test Card Details
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
| NEXT_PUBLIC_APP_URL | https://your-app.vercel.app |

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

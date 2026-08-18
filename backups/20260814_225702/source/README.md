# VetAcademia - Veterinary Education Portal

India's comprehensive veterinary education platform for B.V.Sc, M.V.Sc, and Ph.D students.

## Features

- **Curriculum Management** - Complete syllabus for AHDP, B.V.Sc, M.V.Sc, Ph.D
- **Mock Tests** - Adaptive tests with detailed analytics
- **Study Materials** - PDFs, videos, and flashcards
- **Expert Consultations** - Book sessions with veterinary experts
- **Payment Integration** - Razorpay for secure payments
- **Admin Panel** - Complete content and user management

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js 16 | React Framework |
| Tailwind CSS | Styling |
| shadcn/ui | UI Components |
| Prisma | ORM |
| SQLite/PostgreSQL | Database |
| NextAuth.js | Authentication |
| Razorpay | Payments |

## Quick Start

### 1. Install Dependencies
```bash
cd vetacademia-next
npm install
```

### 2. Setup Database
```bash
npx prisma migrate dev
npx tsx prisma/seeds/seed.ts
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Open Browser
```
http://localhost:3000
```

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@vetacademia.com | admin123 |
| Student | student@vetacademia.com | student123 |

## Project Structure

```
vetacademia-next/
├── src/
│   ├── app/              # Pages & Routes
│   │   ├── (auth)/       # Login, Signup
│   │   ├── admin/        # Admin Panel
│   │   ├── api/          # API Routes
│   │   ├── syllabus/     # Curriculum Pages
│   │   └── ...
│   ├── components/       # Reusable Components
│   │   ├── ui/           # shadcn/ui
│   │   ├── layout/       # Navbar, Footer
│   │   └── admin/        # Admin Components
│   └── lib/              # Utilities
│       ├── prisma.ts     # Database Client
│       └── auth.ts       # NextAuth Config
├── prisma/
│   ├── schema.prisma     # Database Schema
│   └── seeds/            # Seed Data
└── public/               # Static Assets
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment guide.

### Quick Deploy to Vercel
1. Push to GitHub
2. Import on Vercel
3. Add environment variables
4. Deploy!

## Environment Variables

| Variable | Description |
|----------|-------------|
| DATABASE_URL | Database connection string |
| NEXTAUTH_SECRET | NextAuth secret key |
| NEXTAUTH_URL | App URL |
| RAZORPAY_KEY_ID | Razorpay test/live key |
| RAZORPAY_KEY_SECRET | Razorpay secret |

## License

MIT License

## Support

For support, email contact@vetacademia.com

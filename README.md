# Office Management Web Application

Enterprise-grade office administration platform built with Next.js 15, TypeScript, Prisma, and Supabase PostgreSQL.

## Features

- **Dashboard** — Analytics, charts, KPIs, real-time refresh
- **Visitor Management** — Pre-registration, check-in/out, passes, approval workflow
- **Meeting Room Booking** — Calendar view, availability, recurring bookings, conflict prevention
- **Inventory Management** — Stock tracking, movements, low-stock alerts, categories
- **Stationery Management** — Issuance tracking, usage analytics, recommendations
- **Document Stock** — Inventory tracking, reprint request workflow
- **Vendor Management** — CRUD, categories, purchase history
- **Purchase Requests** — Multi-step approval workflow, budget tracking
- **Reports & Analytics** — PDF, Excel, CSV export with dynamic filters
- **User & Role Management** — RBAC with 4 system roles
- **Notifications** — Real-time alerts for approvals, stock, visitors
- **Audit & Activity Logging** — Full CRUD and auth event tracking

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, ShadCN UI |
| State | Zustand, TanStack Query |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Calendar | FullCalendar |
| Backend | Next.js API Routes |
| ORM | Prisma 7 |
| Database | Supabase PostgreSQL |
| Auth | JWT (access + refresh tokens), RBAC |
| Storage | Supabase Storage |
| Email | Resend |
| Export | jsPDF, SheetJS (xlsx) |
| Deployment | Vercel |

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, forgot/reset password
│   ├── (dashboard)/     # Protected module pages
│   └── api/             # REST API routes (57 endpoints)
├── components/
│   ├── ui/              # ShadCN UI components
│   ├── layout/          # Sidebar, header, layouts
│   ├── shared/          # DataTable, pagination, etc.
│   └── modules/         # Module-specific components
├── lib/
│   ├── api/             # API client abstraction layer
│   ├── auth/            # JWT, permissions, session
│   ├── middleware/      # Auth & rate limiting
│   ├── services/        # Audit, notifications, email
│   └── validations/     # Zod schemas per module
├── hooks/               # useAuth, usePermissions
├── store/               # Zustand stores
├── types/               # Shared TypeScript types
└── generated/prisma/    # Prisma client (auto-generated)
prisma/
├── schema.prisma        # 32 models, 24 enums
└── seed.ts              # Roles & permissions only
scripts/
└── create-admin.ts      # Manual first-user creation
```

## Prerequisites

- Node.js 20+
- npm 10+
- Supabase account (PostgreSQL + Storage)
- Resend account (optional, for email)

## Setup

### 1. Clone and install

```bash
cd office
npm install
```

### 2. Configure environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `JWT_SECRET` | Access token secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | Refresh token secret (min 32 chars) |
| `NEXT_PUBLIC_APP_URL` | App URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `RESEND_API_KEY` | Resend API key (optional) |
| `RESEND_FROM_EMAIL` | Sender email address |

### 3. Supabase setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database** and copy the connection string (URI mode)
3. Set `DATABASE_URL` in `.env.local`:
   ```
   DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
4. For migrations, also set a direct connection URL if using connection pooling:
   ```
   DIRECT_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
   ```
5. Enable **Storage** and create a bucket named `office-files` (private)

### 4. Database migration

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

The seed script creates **roles and permissions only** — no sample users.

### 5. Create first admin user

```bash
npx tsx scripts/create-admin.ts \
  --email admin@yourcompany.com \
  --password "YourSecurePassword123!" \
  --firstName Admin \
  --lastName User \
  --role SUPER_ADMIN
```

### 6. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with your admin credentials.

## User Roles

| Role | Description |
|------|-------------|
| **Super Admin** | Full system access, all permissions |
| **Office Admin** | User management, all module write/approve access |
| **Management** | Approval workflows, reports, read + limited write |
| **Employee** | Self-service: bookings, visitors, purchase requests |

## API Overview

All API routes require authentication except auth endpoints. Responses follow:

```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 100 }
}
```

Key endpoints:

- `POST /api/auth/login` — Login
- `GET /api/dashboard/stats` — Dashboard metrics
- `GET/POST /api/visitors` — Visitor management
- `GET/POST /api/bookings` — Room bookings
- `GET/POST /api/inventory/items` — Inventory
- `GET/POST /api/purchase-requests` — Purchase workflow
- `POST /api/reports/export` — Export reports (PDF/Excel/CSV)

## Deployment (Vercel)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Office Management Web Application"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Deploy on Vercel

1. Import the repository at [vercel.com](https://vercel.com)
2. Set all environment variables from `.env.example`
3. Vercel will run `prisma generate && next build` automatically
4. After deploy, run migrations against production DB:
   ```bash
   DATABASE_URL=<production-url> npx prisma migrate deploy
   DATABASE_URL=<production-url> npm run db:seed
   DATABASE_URL=<production-url> npx tsx scripts/create-admin.ts ...
   ```

### 3. Supabase production

- Use connection pooling URL for `DATABASE_URL` in Vercel
- Enable Row Level Security on sensitive tables if exposing Supabase client | optional
- Configure Storage bucket policies for authenticated uploads

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run migrations (dev) |
| `npm run db:deploy` | Deploy migrations (production) |
| `npm run db:seed` | Seed roles & permissions |
| `npm run db:studio` | Open Prisma Studio |

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT access tokens (15 min) + refresh tokens (7 days) in httpOnly cookies
- RBAC middleware on all protected routes
- Input validation with Zod on all API endpoints
- Rate limiting on API routes
- CSRF protection via SameSite cookies
- Audit logging for all mutations
- Session timeout after 30 minutes of inactivity

## License

Proprietary — All rights reserved.

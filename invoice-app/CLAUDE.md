# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # development server (Turbopack, http://localhost:3000)
npm run build    # production build + TypeScript check
npm run start    # production server

npx prisma migrate dev --name <name>   # apply schema changes to SQLite
npx prisma generate                    # regenerate client after schema changes
npx prisma studio                      # visual DB browser
```

## Architecture

**Next.js 16 App Router** — client components for all interactive pages (auth, invoice list, forms). Server components only for detail/edit pages that can query Prisma directly.

```
app/
  page.tsx                      # 'use client' — invoice list + stats, fetches via API
  layout.tsx                    # root layout, wraps body in <AuthProvider>
  not-found.tsx                 # custom 404 page
  login/page.tsx                # 'use client' — login form, stores auth_user in localStorage
  register/page.tsx             # 'use client' — registration form
  invoices/
    new/page.tsx                # create form (server shell + InvoiceForm)
    [id]/page.tsx               # invoice detail (server component, Prisma direct)
    [id]/edit/page.tsx          # edit form (server component, Prisma direct)
  api/
    auth/
      login/route.ts            # POST — validates credentials, sets httpOnly cookie
      logout/route.ts           # POST — clears auth_token cookie
      register/route.ts         # POST — creates user (bcrypt hash)
    invoices/
      route.ts                  # GET (all or paginated), POST (create)
      [id]/route.ts             # GET, PUT, DELETE
      stats/route.ts            # GET — total, pagadas, totalFacturado
  generated/prisma/             # auto-generated — do not edit

components/
  NavBar.tsx                    # 'use client' — user display + logout, reads AuthContext
  InvoiceForm.tsx               # 'use client' — create/edit form with reactive totals
  InvoiceLineItem.tsx           # 'use client' — single product row
  InvoiceList.tsx               # 'use client' — table with delete/navigate, accepts onRefresh
  InvoicePreview.tsx            # 'use client' — printable invoice document
  ThemeToggle.tsx               # 'use client' — dark/light toggle
  ToastContainer.tsx            # 'use client' — global toast notifications

lib/
  authContext.tsx               # React context: user state, login(), logout()
  jwt.ts                        # signToken, verifyToken, extractCookieToken (jose)
  prisma.ts                     # PrismaClient singleton (DATABASE_URL guard)
  schemas.ts                    # Zod schemas: invoiceFormSchema, invoiceItemSchema
  types.ts                      # InvoiceInput, InvoiceWithItems, InvoiceStatus, PaginatedResult
  errors.ts                     # AppError, NotFoundError, UnauthorizedError, handleApiError
  response.ts                   # successResponse, createdResponse, noContentResponse
  toastStore.ts                 # toast state store

hooks/
  useInvoiceFetch.ts            # apiFetch wrapper (credentials: same-origin, error handling)
  useInvoiceActions.ts          # delete + changeStatus with cookie auth
  useInvoiceSubmit.ts           # create/update form submit with cookie auth

services/
  invoice.service.ts            # getAllInvoices, getAllInvoicesPaginated, CRUD + computeTotals

repositories/
  invoice.repository.ts         # findAll, findPaginated, findById, create, update, delete

prisma/
  schema.prisma                 # User, Invoice, InvoiceItem models + indexes
prisma.config.ts                # datasource URL wiring
middleware.ts                   # JWT cookie verification + rate limiting on /api/auth/*
```

## Critical Prisma 7 Differences

**PrismaClient requires an adapter** — the no-arg constructor does not exist:

```ts
// lib/prisma.ts pattern — must follow this exactly
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '@/app/generated/prisma/client'  // NOT from '@prisma/client'

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
```

**Generated client path:** `@/app/generated/prisma/client` (not the npm package).  
**Schema generator:** `provider = "prisma-client"` (not `prisma-client-js`).

## Critical Next.js 16 Differences

**Route params are async** — must `await ctx.params`:

```ts
type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx): Promise<Response> {
  const { id } = await ctx.params  // await required
}

// Pages:
export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
}
```

**cookies() is async** in Next.js 15+:

```ts
import { cookies } from 'next/headers'
const cookieStore = await cookies()
const token = cookieStore.get('auth_token')?.value
```

## Authentication (httpOnly Cookie JWT)

Auth uses **JWT stored in an httpOnly cookie** (`auth_token`), signed with `JWT_SECRET` via the `jose` library (Edge + Node compatible).

**Flow:**
1. `POST /api/auth/login` → verifies bcrypt password → sets `auth_token` cookie (httpOnly, SameSite=lax, 8h) → returns `{ user }`
2. Browser sends cookie automatically on all same-origin requests (`credentials: 'same-origin'`)
3. `middleware.ts` verifies cookie JWT on all `/api/*` except `/api/auth/*`
4. Route handlers call `await cookies()` from `next/headers` to extract and verify the token
5. `POST /api/auth/logout` → deletes the cookie server-side

**Auth context** (`lib/authContext.tsx`):
- `login(user)` — stores `auth_user` in localStorage (display only), sets React state
- `logout()` — calls `/api/auth/logout`, clears localStorage, redirects to `/login`
- Token itself is **never accessible from JavaScript** (httpOnly)

**Rate limiting** — `middleware.ts` applies in-memory sliding window (5 req / 15 min per IP) to `/api/auth/login` and `/api/auth/register`.

## Data Flow

Totals are **computed server-side** in `invoice.service.ts` — never trusted from the client:

```
item.total = quantity × unitPrice
subtotal   = Σ items[].total
tax        = subtotal × (taxRate / 100)
total      = subtotal + tax
```

All DB writes use `prisma.$transaction()` for atomicity.  
Invoice numbers are globally sequential (`FAC-001`, `FAC-002`…), generated inside the create transaction.  
PUT replaces all items by deleting and re-creating them (no partial update).  
All queries filter by `userId` to prevent IDOR.

## GET /api/invoices Behavior

| Query params | Response shape |
|---|---|
| None | `{ data: Invoice[] }` — all user's invoices |
| `?page=N&pageSize=M` | `{ data: { data, total, page, pageSize, totalPages } }` — paginated |

## Environment

`.env` requires:
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="min-32-char-secret"
```

## Test User

```
email:    edward@test.com
password: Test1234!
```
Has 3 invoices: FAC-022 (pagada), FAC-023 (enviada), FAC-024 (borrador).

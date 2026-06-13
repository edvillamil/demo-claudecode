# AGENTS.md

This file provides guidance to AI agents working with this repository.

## Commands

```bash
npm run dev      # development server (Turbopack, http://localhost:3000)
npm run build    # production build + TypeScript check
npm run start    # production server

npx prisma migrate dev --name <name>   # apply schema changes to SQLite
npx prisma generate                    # regenerate client after schema changes
npx prisma studio                      # visual DB browser
```

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router |
| ORM | Prisma 7 + libsql adapter (SQLite) |
| Auth | JWT (jose) via httpOnly cookie |
| Validation | Zod v3 |
| Styling | Tailwind CSS v4 |
| Language | TypeScript strict |

## Project Structure

```
app/
  page.tsx                      # 'use client' — home: invoice list + stats (fetches API)
  layout.tsx                    # root layout — wraps <AuthProvider>, renders <NavBar>
  not-found.tsx                 # custom 404 page
  login/page.tsx                # 'use client' — login form
  register/page.tsx             # 'use client' — registration form
  invoices/
    new/page.tsx                # server shell + <InvoiceForm>
    [id]/page.tsx               # server component — invoice detail (Prisma direct)
    [id]/edit/page.tsx          # server component — edit form (Prisma direct)
  api/
    auth/
      login/route.ts            # POST — sets httpOnly auth_token cookie
      logout/route.ts           # POST — deletes auth_token cookie
      register/route.ts         # POST — bcrypt hash + user create
    invoices/
      route.ts                  # GET (all or paginated), POST (create)
      [id]/route.ts             # GET, PUT, DELETE
      stats/route.ts            # GET — { total, pagadas, totalFacturado }
  generated/prisma/             # auto-generated Prisma client — DO NOT EDIT

components/
  NavBar.tsx                    # 'use client' — reads AuthContext, shows user + logout
  InvoiceForm.tsx               # 'use client' — create/edit form
  InvoiceLineItem.tsx           # 'use client' — line item row
  InvoiceList.tsx               # 'use client' — invoice table, accepts onRefresh prop
  InvoicePreview.tsx            # 'use client' — printable invoice view
  ThemeToggle.tsx               # 'use client' — dark/light mode toggle
  ToastContainer.tsx            # 'use client' — global notification system

lib/
  authContext.tsx               # AuthProvider + useAuth() hook (user, login, logout)
  jwt.ts                        # signToken, verifyToken, extractCookieToken
  prisma.ts                     # PrismaClient singleton (requires DATABASE_URL)
  schemas.ts                    # Zod: invoiceFormSchema, invoiceItemSchema
  types.ts                      # InvoiceInput, InvoiceWithItems, PaginatedResult<T>
  errors.ts                     # AppError hierarchy + handleApiError
  response.ts                   # successResponse, createdResponse, noContentResponse
  toastStore.ts                 # toast state store

hooks/
  useInvoiceFetch.ts            # apiFetch<T> — credentials: same-origin, unwraps { data }
  useInvoiceActions.ts          # delete + changeStatus (uses cookie automatically)
  useInvoiceSubmit.ts           # form submit for create/update

services/
  invoice.service.ts            # business logic + computeTotals (server-side only)

repositories/
  invoice.repository.ts         # Prisma queries: findAll, findPaginated, CRUD

middleware.ts                   # rate limit (/api/auth/*) + JWT cookie check (/api/*)
prisma/schema.prisma            # User, Invoice, InvoiceItem + DB indexes
prisma.config.ts                # datasource wiring
```

## Prisma 7 — Critical Rules

**Always use the adapter — no-arg constructor does not exist:**

```ts
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '@/app/generated/prisma/client'  // NOT '@prisma/client'

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
```

After any schema change: `npx prisma migrate dev --name <name>` then `npx prisma generate`.

## Next.js 16 — Critical Rules

**Route params are async:**

```ts
type Ctx = { params: Promise<{ id: string }> }
export async function GET(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
}
```

**`cookies()` from `next/headers` is async:**

```ts
import { cookies } from 'next/headers'
const cookieStore = await cookies()
const token = cookieStore.get('auth_token')?.value
```

**`useSearchParams()` requires a `<Suspense>` boundary** in client components.

## Authentication Pattern

All protected API routes use this helper (do not use Authorization header):

```ts
async function getUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    if (!token) return null
    const payload = await verifyToken(token)
    return payload.sub
  } catch {
    return null
  }
}
```

All queries must filter by `userId` to prevent IDOR:

```ts
prisma.invoice.findUnique({ where: { id, userId } })
```

## Client-Side Fetch Pattern

All client fetches use `credentials: 'same-origin'` — no manual token injection needed:

```ts
const res = await fetch('/api/invoices', { credentials: 'same-origin' })
// or via apiFetch which sets credentials automatically:
const data = await apiFetch<InvoiceWithItems[]>('/api/invoices')
```

## Data Integrity Rules

- Totals (`subtotal`, `tax`, `total`) are computed **server-side** in `computeTotals()` — never accept from client
- All invoice writes use `prisma.$transaction()` for atomicity
- Invoice numbers are globally sequential, generated inside the create transaction
- PUT replaces all items (deleteMany + recreate) — no partial item update

## GET /api/invoices

| Params | Response |
|---|---|
| none | `{ data: Invoice[] }` — all invoices |
| `?page=N&pageSize=M` | `{ data: PaginatedResult<Invoice> }` |

## Rate Limiting

In-memory sliding window on `/api/auth/login` and `/api/auth/register`:
- **5 requests per IP per 15 minutes**
- Returns `429` with `Retry-After` header when exceeded

## Environment Variables

```
DATABASE_URL="file:./dev.db"    # libsql file URL
JWT_SECRET="min-32-chars"       # signs/verifies JWT tokens
```

## Test User

```
email:    edward@test.com
password: Test1234!
```

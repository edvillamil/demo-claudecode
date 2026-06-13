# AGENTS.md

> **Nota:** Este directorio (`invoice-app/`) contiene la versión monolítica original de la app. El código activo fue migrado a un **monorepo npm workspaces** en el directorio raíz. Ver estructura en `apps/api/`, `apps/web/`, y `packages/shared/`.

This file provides guidance to AI agents working with this repository.

## Monorepo Overview

El proyecto está organizado como un monorepo con tres paquetes:

| Paquete | Path | Puerto | Rol |
|---|---|---|---|
| `@invoice/api` | `apps/api/` | 3001 | Next.js 16 — backend only (API routes, Prisma, JWT) |
| `@invoice/web` | `apps/web/` | 3000 | Next.js 16 — frontend only (pages, components, hooks) |
| `@invoice/shared` | `packages/shared/` | — | TypeScript types + Zod schemas (shared) |

## Commands

```bash
# Desde la raíz del monorepo (demo-claudecode/):
npm install            # instala todas las dependencias (workspaces hoisting)
npm run dev            # arranca api (3001) y web (3000) en paralelo
npm run dev:api        # solo API
npm run dev:web        # solo Web
npm run build          # build de ambas apps

# Desde apps/api/:
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
| Validation | Zod v4 |
| Styling | Tailwind CSS v4 |
| Language | TypeScript strict |

## Project Structure — apps/api

```
apps/api/
  app/api/
    auth/
      login/route.ts            # POST — sets httpOnly auth_token cookie
      logout/route.ts           # POST — deletes auth_token cookie
      register/route.ts         # POST — bcrypt hash + user create
    invoices/
      route.ts                  # GET (all or paginated), POST (create)
      [id]/route.ts             # GET, PUT, DELETE
      stats/route.ts            # GET — { total, pagadas, totalFacturado }
  app/generated/prisma/         # auto-generated Prisma client — DO NOT EDIT

  lib/
    jwt.ts                      # signToken, verifyToken, extractCookieToken
    prisma.ts                   # PrismaClient singleton (requires DATABASE_URL)
    errors.ts                   # AppError hierarchy + handleApiError
    response.ts                 # successResponse, createdResponse, noContentResponse

  services/
    invoice.service.ts          # business logic + computeTotals (server-side only)

  repositories/
    invoice.repository.ts       # Prisma queries: findAll, findPaginated, CRUD

  middleware.ts                 # rate limit (/api/auth/*) + JWT cookie check (/api/*)
  prisma/schema.prisma          # User, Invoice, InvoiceItem + DB indexes
  prisma.config.ts              # datasource wiring
  next.config.ts                # security headers only (no rewrites)
```

## Project Structure — apps/web

```
apps/web/
  app/
    page.tsx                    # 'use client' — home: invoice list + stats
    layout.tsx                  # root layout — wraps <AuthProvider>, renders <NavBar>
    not-found.tsx               # custom 404 page
    login/page.tsx              # 'use client' — login form
    register/page.tsx           # 'use client' — registration form
    invoices/
      new/page.tsx              # server shell + <InvoiceForm>
      [id]/page.tsx             # server component — fetches from API (NOT Prisma)
      [id]/edit/page.tsx        # server component — fetches from API (NOT Prisma)

  components/
    NavBar.tsx                  # 'use client' — reads AuthContext, shows user + logout
    InvoiceForm.tsx             # 'use client' — create/edit form
    InvoiceLineItem.tsx         # 'use client' — line item row
    InvoiceList.tsx             # 'use client' — invoice table, accepts onRefresh prop
    InvoicePreview.tsx          # 'use client' — printable invoice view
    ThemeToggle.tsx             # 'use client' — dark/light mode toggle
    ToastContainer.tsx          # 'use client' — global notification system

  lib/
    authContext.tsx             # AuthProvider + useAuth() hook (user, login, logout)
    toastStore.ts               # toast state store (zustand)

  hooks/
    useInvoiceFetch.ts          # apiFetch<T> — credentials: same-origin, unwraps { data }
    useInvoiceActions.ts        # delete + changeStatus (uses cookie automatically)
    useInvoiceSubmit.ts         # form submit for create/update

  next.config.ts                # security headers + rewrites /api/* → http://localhost:3001
```

## Project Structure — packages/shared

```
packages/shared/src/
  types.ts    # InvoiceInput, InvoiceWithItems, InvoiceStatus, PaginatedResult<T>
  schemas.ts  # invoiceFormSchema, invoiceItemSchema, form value types
  index.ts    # re-exports all
```

Import from shared:
```ts
import type { InvoiceWithItems, InvoiceInput } from '@invoice/shared'
import { invoiceFormSchema } from '@invoice/shared'
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

All protected API routes in `apps/api` use this helper:

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

## Cookie Proxy Pattern

`apps/web` does NOT have Prisma. All data access goes through the API.

Browser fetches stay same-origin (`localhost:3000`) via `next.config.ts` rewrites:
```ts
rewrites: [{ source: '/api/:path*', destination: 'http://localhost:3001/api/:path*' }]
```

Server-side fetches in `apps/web` (e.g., invoice detail pages) must forward the cookie manually:
```ts
const cookieStore = await cookies()
const token = cookieStore.get('auth_token')?.value
const res = await fetch(`${API_URL}/api/invoices/${id}`, {
  headers: token ? { Cookie: `auth_token=${token}` } : {},
  cache: 'no-store',
})
```

## Client-Side Fetch Pattern

All client fetches in `apps/web` use `credentials: 'same-origin'`:
```ts
const res = await fetch('/api/invoices', { credentials: 'same-origin' })
// or via apiFetch which sets credentials automatically:
const data = await apiFetch<InvoiceWithItems[]>('/api/invoices')
```

## Data Integrity Rules

- Totals (`subtotal`, `tax`, `total`) computed **server-side** in `computeTotals()` — never accept from client
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

`apps/api/.env`:
```
DATABASE_URL="file:./dev.db"    # libsql file URL
JWT_SECRET="min-32-chars"       # signs/verifies JWT tokens
```

## Test User

```
email:    edward@test.com
password: Test1234!
```

Has 3 invoices: FAC-022 (pagada), FAC-023 (enviada), FAC-024 (borrador).

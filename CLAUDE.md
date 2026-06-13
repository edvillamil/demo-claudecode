# CLAUDE.md

## Available skills

| Skill | Descripción |
|---|---|
| `/explain-code` | Explica super resumido el código base del proyecto |
| `/greeting` | Saluda al usuario inicial, claro y profesional |
| `/react-rules` | Genera un proyecto con la estructura de React con TypeScript |
| `/frontend-design` | Mejora el diseño e interfaces UI/UX de la aplicación |

## Skill trigger rules

| Skill | Se activa cuando... |
|---|---|
| `/explain-code` | El usuario pide una explicación del proyecto o codebase |
| `/greeting` | El usuario saluda o inicia conversación |
| `/react-rules` | El usuario pide crear una aplicación o componente React, o agregar/modificar componentes, hooks, estado, formularios o lógica de UI en React |
| `/frontend-design` | El usuario pide mejorar, cambiar o rediseñar la UI, interfaces, diseño visual, estilos, colores, layout o experiencia de usuario de la app |

## Monorepo Structure (npm workspaces)

```
demo-claudecode/
├── package.json              # root workspace (private) — runs both apps
├── apps/
│   ├── api/                  # @invoice/api — Next.js 16 backend only (port 3001)
│   │   ├── app/api/**        # route handlers
│   │   ├── services/         # business logic
│   │   ├── repositories/     # Prisma queries
│   │   ├── lib/              # prisma.ts, jwt.ts, errors.ts, response.ts
│   │   ├── prisma/           # schema + seed
│   │   └── middleware.ts     # JWT auth + rate limiting
│   └── web/                  # @invoice/web — Next.js 16 frontend only (port 3000)
│       ├── app/              # pages (no api routes)
│       ├── components/
│       ├── hooks/
│       └── lib/              # authContext.tsx, toastStore.ts
└── packages/
    └── shared/               # @invoice/shared — types + Zod schemas
        └── src/
            ├── types.ts
            ├── schemas.ts
            └── index.ts
```

## Commands

```bash
# From monorepo root (demo-claudecode/):
npm run dev        # start both api (3001) and web (3000) in parallel
npm run dev:api    # start api only
npm run dev:web    # start web only
npm run build      # build both apps
```

## Key Architecture Notes

- `apps/web` proxies `/api/*` → `http://localhost:3001` via Next.js rewrites (cookies stay same-origin)
- `apps/web` has NO Prisma — all data access goes through the API
- Shared types/schemas imported as `import { ... } from '@invoice/shared'`
- Both apps resolve `@invoice/shared` via tsconfig paths (no build step needed)
- `apps/api/.env` must contain `DATABASE_URL` and `JWT_SECRET`

## Prisma 7 — Critical Pattern

```ts
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '@/app/generated/prisma/client'  // NOT '@prisma/client'

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
```

Generated client lives at `apps/api/app/generated/prisma/` — never import from `@prisma/client` directly.

## Next.js 16 — Critical Patterns

```ts
// Async route params
type Ctx = { params: Promise<{ id: string }> }
export async function GET(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
}

// Async cookies
import { cookies } from 'next/headers'
const cookieStore = await cookies()
const token = cookieStore.get('auth_token')?.value
```

`useSearchParams()` requires `<Suspense>` boundary in client components.

## Authentication Flow

1. `POST /api/auth/login` → sets `auth_token` httpOnly cookie (8h, SameSite=lax)
2. Browser sends cookie automatically on all `/api/*` requests (`credentials: 'same-origin'`)
3. `apps/api/middleware.ts` verifies cookie on all `/api/*` except `/api/auth/*`
4. Route handlers extract userId via `await cookies()` from `next/headers`

Rate limiting: 5 req / 15 min per IP on login and register (in-memory sliding window).

## Test User

```
email:    edward@test.com
password: Test1234!
```

Has 3 invoices: FAC-022 (pagada), FAC-023 (enviada), FAC-024 (borrador).

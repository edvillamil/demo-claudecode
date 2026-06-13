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

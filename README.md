# demo-claudecode — Monorepo de Facturación

Monorepo con **npm workspaces** que separa el backend y frontend de una aplicación de gestión de facturas. Ambas apps son independientes y pueden desplegarse por separado.

## Apps

| App | Paquete | Puerto | Descripción |
|---|---|---|---|
| `apps/api` | `@invoice/api` | 3001 | Next.js 16 — solo rutas API, Prisma, JWT |
| `apps/web` | `@invoice/web` | 3000 | Next.js 16 — páginas y componentes UI |
| `packages/shared` | `@invoice/shared` | — | Tipos TypeScript y schemas Zod compartidos |

## Características

- Autenticación con JWT en **cookie httpOnly** (resistente a XSS)
- Registro e inicio de sesión con contraseñas hasheadas (bcrypt)
- CRUD completo de facturas con líneas de detalle
- Totales calculados **server-side** (subtotal, impuesto, total)
- Rate limiting en endpoints de autenticación (5 intentos / 15 min por IP)
- Proxy transparente en `apps/web` → `apps/api` (las cookies funcionan sin configuración extra)
- Modo oscuro / claro con Tailwind CSS v4

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| Base de datos | SQLite vía Prisma 7 + libsql |
| Autenticación | JWT (jose) + httpOnly cookies |
| Validación | Zod v4 |
| Estilos | Tailwind CSS v4 |
| Lenguaje | TypeScript strict |

## Requisitos

- **Node.js** 18 o superior
- **npm** 9 o superior (con soporte de workspaces)

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/edvillamil/demo-claudecode.git
cd demo-claudecode
```

### 2. Instalar todas las dependencias

Desde la raíz del monorepo (un solo comando instala todas las apps):

```bash
npm install
```

### 3. Configurar variables de entorno del API

```bash
cp apps/api/.env.example apps/api/.env
```

Edita `apps/api/.env`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="cambia-esto-por-un-secreto-de-al-menos-32-caracteres"
```

> `JWT_SECRET` debe tener mínimo 32 caracteres.

### 4. Inicializar la base de datos

```bash
cd apps/api
npx prisma migrate dev
npx prisma generate
cd ../..
```

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

Inicia ambas apps en paralelo:
- API: [http://localhost:3001](http://localhost:3001)
- Web: [http://localhost:3000](http://localhost:3000)

---

## Scripts

```bash
# Desde la raíz del monorepo:
npm run dev        # API (3001) + Web (3000) en paralelo
npm run dev:api    # Solo API
npm run dev:web    # Solo Web
npm run build      # Build de ambas apps

# Desde apps/api/:
npx prisma studio          # Explorador visual de la base de datos
npx prisma migrate dev     # Aplicar cambios del schema
npx prisma generate        # Regenerar cliente de Prisma
```

## Estructura

```
demo-claudecode/
├── package.json              # root workspace (private)
├── apps/
│   ├── api/                  # @invoice/api — backend Next.js 16
│   │   ├── app/api/          # rutas: auth, invoices, stats
│   │   ├── services/         # lógica de negocio
│   │   ├── repositories/     # queries Prisma
│   │   ├── lib/              # prisma, jwt, errors, response
│   │   ├── middleware.ts     # rate limiting + verificación JWT
│   │   └── prisma/           # schema + migraciones + seed
│   └── web/                  # @invoice/web — frontend Next.js 16
│       ├── app/              # páginas (login, register, facturas)
│       ├── components/       # UI components
│       ├── hooks/            # useInvoiceFetch, useInvoiceActions, useInvoiceSubmit
│       └── lib/              # authContext, toastStore
└── packages/
    └── shared/               # @invoice/shared — tipos y schemas compartidos
        └── src/
            ├── types.ts      # InvoiceInput, InvoiceWithItems, PaginatedResult
            ├── schemas.ts    # invoiceFormSchema, invoiceItemSchema
            └── index.ts
```

## API Reference

El frontend en `apps/web` hace proxy de `/api/*` hacia `apps/api` (puerto 3001). Todos los endpoints requieren cookie `auth_token` (excepto login/register).

### Autenticación

```http
POST /api/auth/register
{ "name": "string", "email": "string", "password": "string" }

POST /api/auth/login
{ "email": "string", "password": "string" }

POST /api/auth/logout
```

### Facturas

```http
GET    /api/invoices                    # Todas las facturas del usuario
GET    /api/invoices?page=1&pageSize=20 # Paginadas
GET    /api/invoices/stats              # { total, pagadas, totalFacturado }
POST   /api/invoices                    # Crear factura
GET    /api/invoices/:id                # Detalle
PUT    /api/invoices/:id                # Actualizar
DELETE /api/invoices/:id                # Eliminar
```

## Usuario de prueba

```
email:    edward@test.com
password: Test1234!
```

Tiene 3 facturas precargadas (FAC-022, FAC-023, FAC-024).

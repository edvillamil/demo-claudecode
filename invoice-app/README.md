# Invoice App — Versión Monolítica (legacy)

> **Este directorio contiene la versión monolítica original.** El código activo fue migrado a un monorepo en la raíz del repositorio. Ver [`/apps/api`](../apps/api), [`/apps/web`](../apps/web) y [`/packages/shared`](../packages/shared).

---

Aplicación web de gestión de facturas construida con **Next.js 16**, **Prisma 7** y **SQLite**. Permite crear, editar, eliminar y consultar facturas con autenticación segura por usuario.

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| Base de datos | SQLite vía Prisma 7 + libsql |
| Autenticación | JWT (jose) + httpOnly cookies |
| Validación | Zod v4 |
| Estilos | Tailwind CSS v4 |
| Lenguaje | TypeScript |

## Ejecución local (monolito)

```bash
cd invoice-app
npm install
cp .env.example .env   # editar JWT_SECRET
npx prisma migrate dev
npx prisma generate
npm run dev            # http://localhost:3000
```

## Usuario de prueba

```
email:    edward@test.com
password: Test1234!
```

## Monorepo recomendado

Para usar la versión monorepo (separación backend/frontend):

```bash
cd ..                  # raíz del repositorio
npm install
cp apps/api/.env.example apps/api/.env
# editar apps/api/.env
cd apps/api && npx prisma migrate dev && npx prisma generate && cd ../..
npm run dev            # API: 3001, Web: 3000
```

Ver el [README principal](../README.md) para instrucciones completas.

# Invoice App

Aplicación web de gestión de facturas construida con **Next.js 16**, **Prisma 7** y **SQLite**. Permite crear, editar, eliminar y consultar facturas con autenticación segura por usuario.

## Características

- Autenticación con JWT almacenado en **cookie httpOnly** (resistente a XSS)
- Registro e inicio de sesión con contraseñas hasheadas (bcrypt)
- CRUD completo de facturas con líneas de detalle
- Totales calculados **server-side** (subtotal, impuesto, total)
- Paginación e índices de base de datos
- Rate limiting en endpoints de autenticación (5 intentos / 15 min por IP)
- Modo oscuro / claro
- Diseño responsivo con Tailwind CSS

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| Base de datos | SQLite vía Prisma 7 + libsql |
| Autenticación | JWT (jose) + httpOnly cookies |
| Validación | Zod |
| Estilos | Tailwind CSS v4 |
| Lenguaje | TypeScript |

## Requisitos previos

- **Node.js** 18 o superior
- **npm** 9 o superior

## Instalación y ejecución local

### 1. Clonar el repositorio

```bash
git clone https://github.com/edvillamil/demo-claudecode.git
cd demo-claudecode/invoice-app
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea el archivo `.env` en la raíz de `invoice-app/`:

```bash
cp .env.example .env
```

O créalo manualmente con el siguiente contenido:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="cambia-esto-por-un-secreto-de-al-menos-32-caracteres"
```

> **Importante:** `JWT_SECRET` debe tener mínimo 32 caracteres. En producción usa un valor generado aleatoriamente.

### 4. Inicializar la base de datos

```bash
npx prisma migrate dev
npx prisma generate
```

### 5. Ejecutar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## Scripts disponibles

```bash
npm run dev      # Servidor de desarrollo con Turbopack
npm run build    # Build de producción + validación TypeScript
npm run start    # Servidor de producción (requiere build previo)
```

```bash
npx prisma studio          # Explorador visual de la base de datos
npx prisma migrate dev     # Aplicar cambios del schema a la DB
npx prisma generate        # Regenerar el cliente de Prisma
```

## Estructura del proyecto

```
invoice-app/
├── app/
│   ├── api/
│   │   ├── auth/          # login, logout, register
│   │   └── invoices/      # CRUD + stats
│   ├── invoices/          # Páginas de detalle y edición
│   ├── login/             # Página de inicio de sesión
│   ├── register/          # Página de registro
│   └── page.tsx           # Dashboard principal
├── components/            # Componentes React reutilizables
├── hooks/                 # Hooks personalizados (fetch, submit, actions)
├── lib/                   # Utilidades (jwt, auth context, errores, schemas)
├── repositories/          # Capa de acceso a datos (Prisma)
├── services/              # Lógica de negocio
├── middleware.ts           # Rate limiting + verificación JWT
└── prisma/
    ├── schema.prisma       # Modelos de base de datos
    └── migrations/        # Historial de migraciones
```

## Uso de la API

Todos los endpoints de facturas requieren autenticación (cookie `auth_token` establecida al hacer login).

### Autenticación

```http
POST /api/auth/register
Content-Type: application/json

{ "name": "Tu Nombre", "email": "tu@email.com", "password": "tuPassword123" }
```

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "tu@email.com", "password": "tuPassword123" }
```

```http
POST /api/auth/logout
```

### Facturas

```http
GET  /api/invoices              # Todas las facturas del usuario
GET  /api/invoices?page=1&pageSize=20  # Paginadas
GET  /api/invoices/stats        # Totales y conteos
POST /api/invoices              # Crear factura
GET  /api/invoices/:id          # Detalle
PUT  /api/invoices/:id          # Actualizar
DELETE /api/invoices/:id        # Eliminar
```

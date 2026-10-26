# Sistema de Agendamiento de Citas Médicas

Sistema de gestión de citas médicas con HCE, agendamiento, notificaciones y reportes.

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | NestJS 11 + Prisma 5 + TypeScript |
| Frontend | Next.js 14 (App Router) + React 18 + Tailwind CSS |
| Base de datos | SQLite (desarrollo) / PostgreSQL (producción) |
| Auth | JWT + refresh tokens rotativos (cookie httpOnly) |
| Notificaciones | WhatsApp Cloud API + SMTP + WebSocket |

## Requisitos

- Node.js 20+
- npm 10+
- (Opcional) Docker + Docker Compose

## Instalación

```bash
# 1. Clonar y entrar
git clone <repo>
cd agendamiento

# 2. Backend
cd backend
cp .env.example .env     # Editar secretos
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run build
npm run start:dev        # http://localhost:3000

# 3. Frontend
cd ../frontend
npm install
npm run dev              # http://localhost:3001
```

## Variables de entorno

Ver `backend/.env.example` para la lista completa. Variables críticas:

| Variable | Descripción |
|----------|-------------|
| `JWT_SECRET` | Secreto JWT (generar con `openssl rand -hex 64`) |
| `JWT_REFRESH_SECRET` | Secreto refresh (generar con `openssl rand -hex 64`) |
| `FRONTEND_URL` | URL del frontend para CORS |
| `DATABASE_URL` | `file:./dev.db` para SQLite, o cadena Postgres |
| `WHATSAPP_ACCESS_TOKEN` | Token de WhatsApp Business API |

## Comandos principales

```bash
# Backend
npm run build            # Compilar TypeScript
npm run start:dev        # Dev con hot-reload
npx prisma db push       # Sincronizar schema
npm run prisma:seed      # Seed datos demo + permisos
npm test                 # Tests (26 tests)

# Frontend
npm run dev              # Dev con hot-reload
npm run build            # Build producción
npm test                 # Tests (38 tests)

# Ambos
npx tsc --noEmit         # Type check sin emitir
```

## Estructura del proyecto

```
agendamiento/
├── backend/
│   ├── prisma/              # Schema + seeds
│   └── src/
│       ├── common/          # Guards, decorators, pipes, utils
│       └── modules/         # Módulos NestJS
│           ├── auth/        # Login, JWT, refresh tokens
│           ├── citas/       # Agendamiento, reagendamiento
│           ├── hce/         # Historia clínica electrónica
│           ├── pacientes/   # CRUD pacientes
│           ├── especialistas/ # CRUD especialistas
│           ├── reportes/    # Dashboard, export CSV
│           ├── notificaciones/ # WhatsApp, email, WebSocket
│           └── ...
├── frontend/
│   └── src/
│       ├── app/             # Páginas Next.js (App Router)
│       ├── components/      # UI components
│       ├── hooks/           # Custom hooks
│       ├── lib/             # API client, utils, auth
│       └── types/           # TypeScript interfaces
└── PLAN_PROYECTO.md         # Plan y progreso
```

## Rotación de secretos

```bash
# Generar nuevos secretos JWT
openssl rand -hex 64

# Actualizar en .env
JWT_SECRET=<nuevo-valor>
JWT_REFRESH_SECRET=<nuevo-valor>

# Revocar token de WhatsApp en: https://business.facebook.com/settings
```

## Perfiles de base de datos

- **SQLite (dev)**: `DATABASE_URL=file:./dev.db` — desarrollo local
- **PostgreSQL (prod)**: Configurar `DATABASE_URL` con cadena de conexión Postgres

Para sync con Postgres:
```bash
cd backend
docker compose --profile sync up -d
```

## Troubleshooting

### WhatsApp 401
- Verificar `WHATSAPP_ACCESS_TOKEN` en Meta Business
- El token expira cada 60 días, requiere regeneración

### Error de compilación
```bash
cd backend && npx prisma generate && npm run build
```

### Tests fallan por dependencias de NestJS
```bash
cd backend && npm run test
# Si falta NotificationDispatcher, agregar mock en el test spec
```

## Licencia

Uso interno — Instituto de Neurociencias

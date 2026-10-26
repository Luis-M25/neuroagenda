# AGENTS.md — Sistema de Agendamiento de Citas Médicas

## Project overview

NestJS 11 (backend) + Next.js 14 App Router (frontend) + Prisma 5 + SQLite dev / Postgres prod. Instituto de Neurociencias, Ecuador.

## Critical commands

```bash
# Backend (workdir: backend)
npm run build          # nest build
npm run start:dev      # dev with watch (port 3000)
npm test               # jest --passWithNoTests
npx prisma db push     # sync schema to SQLite dev.db
npm run prisma:seed    # ts-node prisma/seed.ts && ts-node prisma/seed-permisos-roles.ts (NOT all seeds!)

# Frontend (workdir: frontend)
npm run dev            # next dev (port 3001)
npm run build          # next build
npm test               # jest
npm run lint           # next lint
```

**Backend has no `lint` script.** Use `npm run typecheck` for tsc.

## Architecture

```
backend/src/
  common/          # Guards, decorators, PrismaService, Winston logger, validators
  modules/
    auth/          # Login, JWT, refresh tokens (bcrypt hashed, rotativo, family-reuse detection)
    citas/         # Agendamiento, reagendamiento, wizard protocolo→especialidad→especialista→fechas
    hce/           # Historia clínica electrónica (10 tabs: consulta, diagnosticos, prescripcion, etc.)
    historia-clinica/      # NEW HCE module — mounted
    historia-clinica-legacy/ # OLD HCE module — STILL MOUNTED (collision risk)
    users/         # Empty/stub module — mounted
    usuarios/      # Real users module (2 endpoints) — mounted
    catalogos/     # Placeholder module — mounted
    pacientes/     # CRUD pacientes + inasistencias + bloqueo
    especialistas/ # CRUD especialistas + validación cédula + color/código calendario
    admins/        # Admin management + permisos granulares
    enfermero/     # Triage: signos vitales, alergias, HC
    auditor/       # Revisa HC (REVISADO / REVISADO_CON_OBSERVACIONES)
    auditoria/     # Audit trail (cada acción → quién/hora/motivo si crítica)
    calendario/    # Vista semanal con reagendar masivo/automático, cancelar día
    notificaciones/ # WhatsApp Cloud API + SMTP + Socket.IO
    reportes/      # Dashboard, export CSV
    ... (+ bloques, horarios, feriados, sedes, consultorios, seguros, permisos, etc.)

frontend/src/
  app/             # Next.js pages per role: admin/, especialista/, enfermero/, auditor/, portero/
  components/      # Reusable UI components
  hooks/           # Custom hooks (useApi, useEspecialistaDashboard)
  lib/
    api/           # API client modules (citas.api.ts, pacientes.api.ts, etc.)
    api-client.ts  # Base fetch wrapper (formatTextFields, single 401→refresh, no retry)
    auth.ts        # Auth helpers (localStorage-based, NO React context)
    routes.ts      # Route constants (ROUTES.admin.*, ROUTES.especialista.*, etc.)
  types/           # TypeScript interfaces per domain
```

## Working conventions

- **Frontend imports**: `@/` alias maps to `src/` (tsconfig paths).
- **Backend imports**: relative. `PrismaService` injected from `src/common/prisma.service.ts`.
- **NestJS modules**: one directory per domain under `modules/<name>/`, with `dto/` subfolder.
- **API base URL**: `NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'`
- **Tailwind**: use primary color tokens (`primary-500`, `primary-600`, etc.), never raw hex.
- **Auth flow**: JWT access token (15m) + refresh token (7d) in httpOnly cookie (backend). Frontend stores accessToken in `localStorage` (non-ideal, see known issues).

## Known issues / gotchas

1. **Middleware matcher páginas role; valida Origin/Referer, NO sesión JWT** (`frontend/src/middleware.ts:91`):
   The matcher only matches API routes. Auth relies on `useEffect` in `app/page.tsx`.

2. **Refresh usa Sesion.refreshHash HMAC + rotación same-family** (`backend/src/modules/auth/auth.service.ts`):
   HMAC lookup via indexed Sesion table, luego bcrypt-compare con up to 50 candidates para reuse detection.

3. **formatTextFields eliminado del api client**: Ya no se post-procesan respuestas.

4. **Single 401→refresh, no retry queue** (`client.ts`): Concurrent 401s each trigger their own refresh. No single-flight pattern, no backoff for 5xx.

5. **No AuthProvider**: State lives in `localStorage` singleton. SSR always sees `isAuthenticated() === false`.

6. **Módulos legacy no montados**: `users/`, `catalogos/`, `historia-clinica-legacy/` ya no están montados en producción.

7. **Seeds not consolidated**: `prisma:seed` runs only 2 of ~12 seed files. `seed-feriados-ecuador.ts` exists but is never invoked from the main seed.

8. **Stub pages**:
   - `frontend/src/app/admin/hce/page.tsx` — 9-line redirect stub

9. **Test coverage <1%**: 9 spec files in backend, 4 test files in frontend. Most modules untested.

10. **No formatter config**: No `.prettierrc` or equivalent. No eslint in backend.

11. **PacientesService restaurado en Fase A**: `pacientes.service.ts` completo con todos los métodos desde commit d691ce0 + fixes.

## opencode.md

`opencode.md` (210 lines) is a **product requirements document** in prose, not developer guidelines. It enumerates roles, flows, states, and color codes. Do NOT treat it as an AGENTS.md or code conventions file. When in doubt about a feature, read it for functional intent only.

## Decision record (from plan)

| # | Decision |
|---|----------|
| D1 | SQLite for local dev, not Postgres |
| D2 | Refactor, don't rebuild |
| D3 | Remove `historia-clinica-legacy/` after verifying `historia-clinica/` covers all routes |
| D4 | Remove `users/`, consolidate into `usuarios/` |
| D5 | Implement or remove `catalogos/` |
| D6 | Single-flight refresh + AuthProvider in frontend |
| D7 | Middleware matcher → page routes, SSR redirect |
| D8 | Firma digital HC: modal + verify-password endpoint |
| D9 | PDF HC: pdfkit in backend |
| D10 | Cancelar protocolo at 3 inasistencias |
| D11 | Tests ≥40% on critical hooks/services |
| D12 | Consolidate seeds into single `prisma:seed` |
| D13 | Don't regenerate existing UI |
| D15 | No microservices / event-bus |

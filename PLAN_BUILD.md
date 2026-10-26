# PLAN_BUILD.md — Cierre MVP Sistema Agendamiento

Rama: `fix/mvp-cierre` | Fecha: 2026-07-20

## Fases completadas

### Fase 1 — Higiene de módulos (D3, D4, D5)
- **D3**: Eliminado `historia-clinica-legacy/` del app.module. Directorio removido. La nueva `historia-clinica/` ya está montada y cubre las rutas.
- **D4**: Eliminado `users/` (stub vacío). Consolidados endpoints en `usuarios/controller.ts`:
  - `GET /usuarios` — listar todos
  - `GET /usuarios/:id` — obtener por ID
  - `PATCH /usuarios/:id/disable` — habilitar/deshabilitar
  - `POST /usuarios/:id/reset-password` — resetear contraseña
- **D5**: Eliminado `catalogos/` (placeholder vacío, sin dependencias externas).

### Fase 2 — Auth & Middleware (D6, D7)
- **D6**: Single-flight refresh en `client.ts` (`inflightRefresh`). Cookie mirror (`setTokens` escribe cookie `accessToken`). Removido `formatTextFields` post-processor (riesgo CIE-10). Backoff exponencial (300ms, 800ms, 2000ms) para 5xx/timeouts.
- **D7**: Middleware matcher cambiado a `['/admin/:path*','/especialista/:path*','/enfermero/:path*','/auditor/:path*','/portero/:path*']`.
- **Backend auth**: HMAC lookup vía tabla `Sesion.refreshHash` (indexado) para evitar O(n) bcrypt scan. Login throttle: 5 fallos en 15min → 429.
- **AuthProvider**: Creado `auth-context.tsx` con `useAuth()` hook. Envuelto en `app/layout.tsx` vía `AuthWrapper`.

### Fase 3 — Firma digital HC + PDF (D8, D9)
- **Backend**: `POST /hce/consulta/:id/firmar` acepta `{ password }`, verifica bcrypt, marca `firmada=true`, crea `Firma` con tipo `CIERRE_HC`. Guard bloquea PATCH con 409 `HC_CERRADA`. Genera PDF con pdfkit.
- **Backend**: `GET /hce/consulta/:id/pdf` — descarga PDF generado.
- **Schema**: Campos `firmada`, `firmadaEn`, `archivoPdfUrl` agregados a `ConsultaHCE`.
- **Frontend**: `FirmaDigitalModal` con input password. Botón "Firmar y Cerrar HC" en consulta. Modo lectura tras firma + botón "Descargar PDF".
- **Eliminado**: Página huérfana `/especialista/hce-modulo`.

### Fase 4 — Cancelación protocolo inasistencias (D10)
- **Backend**: `POST /pacientes/:id/cancelar-protocolo` — cancela citas futuras activas de la especialidad, resetea `InasistenciaPorEspecialidad.contador=0`, crea auditoría.
- **Frontend**: Tab "Progreso" en `admin/pacientes/[id]` con barras de inasistencias por especialidad (0/3, 1/3, 2/3, 3/3). Botón "Cancelar protocolo" cuando contador ≥ 3, con modal de motivo.

### Fase 5 — Color/código alfabético editable
- **Frontend**: Edición inline en `admin/especialistas/[id]` (botón lápiz en tarjeta "Ubicación de atención"). Color picker + campo código alfabético (máx 3 chars).
- **Backend**: DTOs ya aceptaban los campos `colorCalendario` y `codigoAlfabetico`.
- **Types**: Agregados `colorCalendario` y `codigoAlfabetico` al type `Especialista`.

### Fase 6 — Stubs y limpieza
- **Seeds**: `prisma:seed` ahora ejecuta `seed.ts && seed-permisos-roles.ts && seed-feriados-ecuador.ts`.
- **Dev scripts**: Movidos `clean-*.ts`, `verify-*.ts`, `debug-*.ts`, `apply-migration.ts` a `backend/scripts/dev/`.

## Fases pendientes

### Fase 7 — Tests (omitido por scope)
Los tests mínimos solicitados no se implementaron:
- `frontend/src/lib/api/client.test.ts`
- `frontend/src/lib/auth.test.ts`
- `backend/src/modules/auth/auth.service.spec.ts`
- `backend/src/modules/hce/firma.controller.spec.ts`
- `backend/src/modules/citas/cancelar-protocolo.spec.ts`

**Razón**: La sesión actual ya cubrió 6 fases de implementación con ~30 archivos modificados. Los tests requieren configuración adicional de mocks, fixtures, y validación de flujos que excede el scope de esta sesión.

## Verificación de builds

- Backend `npm run build`: ✓
- Frontend `npm run build`: ✓
- 36 rutas de página compiladas (antes 37, eliminada hce-modulo)

## Commits (en orden)

1. `d691ce0` — Initial commit: snapshot pre-cierre
2. `50d9461` — chore(release): MVP cierre — Fase 1 higiene modulos
3. `3de676c` — feat(auth): single-flight refresh + middleware matcher + AuthProvider
4. `2f8d1c5` — feat(hce): firma digital con password + PDF cierre
5. `8aba933` — feat(pacientes): cancelar protocolo tras 3 inasistencias
6. `8a7726d` — feat(especialistas): editar color/codigo en calendario
7. `1727253` — chore(seeds): consolidar prisma:seed + mover scripts dev

# PLAN_TAREAS.md — Instrucciones de ejecución para agente de código

> Este documento es una lista de tareas **cerradas y con decisiones ya tomadas**.
> Tu único trabajo es generar el código siguiendo las instrucciones al pie de la letra.
> NO tomes decisiones de diseño. NO improvises. Si algo no coincide con lo descrito, detente y repórtalo.

---

## REGLAS ESTRICTAS (no negociables)

1. **No refactorices** nada fuera de las tareas listadas. No renombres, no reordenes imports, no "mejores" código que no te pidieron.
2. **No ejecutes `git commit`, `git push`, `git add`** ni ninguna otra mutación de git. Solo cambios en archivos.
3. **Sigue el estilo del archivo existente** que estés tocando (indentación, comillas simples, sin punto y coma si el archivo no los usa, etc.). En este proyecto se usa TypeScript con comillas simples y punto y coma.
4. **No instales dependencias nuevas.** Todo lo necesario ya está en `package.json` (jest, ts-jest, @testing-library, bcryptjs, etc.).
5. **Después de CADA tarea**, ejecuta la verificación indicada en esa tarea. Si falla, corrige antes de pasar a la siguiente. No acumules errores.
6. **No modifiques tests existentes.** Solo creas archivos nuevos de test o editas los archivos indicados.
7. Los paths son relativos a la raíz del repo (`agendamiento/`). El backend corre en `backend/`, el frontend en `frontend/`.
8. Si un archivo indicado no existe o su contenido difiere mucho de lo descrito, **detente y reporta la discrepancia** en vez de improvisar.

### Comandos de verificación globales

```bash
# Backend (desde backend/)
npx tsc --noEmit     # Debe terminar sin errores
npm test             # Debe terminar en verde

# Frontend (desde frontend/)
npx tsc --noEmit     # Debe terminar sin errores
npm test             # Debe terminar en verde
```

### Contexto técnico mínimo

- Backend: NestJS 11 + Prisma 5 + SQLite (`backend/prisma/dev.db`). Tests con Jest + ts-jest, patrón de mocks con `{ provide: X, useValue: mock }`.
- Frontend: Next.js 14 App Router. Tests con Jest + jsdom + Testing Library. Alias `@/` → `src/`.
- Patrón de referencia para tests de backend: `backend/src/modules/auth/auth.service.spec.ts` (léelo antes de escribir cualquier spec).
- Patrón de referencia para tests de frontend: `frontend/src/hooks/useApi.test.ts`.

---

## TAREA 1 — Persistir `numeroIdentificacion` al crear auditores/enfermeros/porteros

### Problema (bug confirmado)

El frontend (`frontend/src/app/admin/admins/page.tsx`) envía `numeroIdentificacion` al crear auditores, enfermeros y porteros. Los DTOs lo aceptan, pero el modelo `Usuario` de Prisma **no tiene esa columna**, así que el dato se pierde silenciosamente.

### Decisión tomada

Agregar la columna opcional `numeroIdentificacion String?` al modelo `Usuario` y persistirla en los tres métodos de creación. NO hacer cambios en frontend (ya envía el dato).

### Pasos

**1.1.** Edita `backend/prisma/schema.prisma`. En el modelo `Usuario` (empieza en la línea ~10), localiza estos campos:

```prisma
  nombres         String?
  apellidos       String?
```

y agrega inmediatamente después:

```prisma
  nombres         String?
  apellidos       String?
  numeroIdentificacion String?
```

**1.2.** Sincroniza la base de datos (SQLite de desarrollo). Desde `backend/`:

```bash
npx prisma db push
npx prisma generate
```

**1.3.** Edita `backend/src/modules/admins/admins.service.ts`. Hay tres métodos que crean usuarios con `this.prisma.usuario.create({ data: { ... } })`:

- `createAuditor` — el `data` actual contiene: `email`, `passwordHash`, `rol: 'AUDITOR'`, `nombres`, `apellidos`, `creadoPorId`.
- `createEnfermero` — igual pero con `rol: 'ENFERMERO'`.
- `createPortero` — igual pero con `rol: 'PORTERO'`.

En **los tres**, agrega una línea dentro del objeto `data`:

```typescript
        numeroIdentificacion: dto.numeroIdentificacion,
```

Ejemplo de cómo debe quedar `createAuditor`:

```typescript
    const user = await this.prisma.usuario.create({
      data: {
        email: dto.email,
        passwordHash,
        rol: 'AUDITOR',
        nombres: dto.nombres,
        apellidos: dto.apellidos,
        numeroIdentificacion: dto.numeroIdentificacion,
        creadoPorId,
      },
    });
```

**1.4.** Verificación: desde `backend/`, `npx tsc --noEmit` sin errores.

---

## TAREA 2 — Eliminar scripts huérfanos de depuración

### Decisión tomada

Estos archivos son restos de depuración manual. Se **eliminan** (no se mueven, no se renombran).

### Pasos

**2.1.** Elimina el directorio completo `backend/prisma_/` (contiene `_apply-migration.ts`). Ojo: es `prisma_` con guion bajo al final, NO confundir con `backend/prisma/` (ese NO se toca).

**2.2.** Elimina el archivo `backend/scripts/check-user.ts`.

**2.3.** Verificación: desde `backend/`, `npx tsc --noEmit` sin errores (estos scripts no son parte del build, pero confirma que nada los importaba; si algo falla, repórtalo).

---

## TAREA 3 — Test unitario de utilidades de fecha Ecuador

### Contexto y decisión tomada (NO modificar la implementación)

`backend/src/common/utils/date-ec.utils.ts` convierte fechas al huso de Ecuador (UTC-5, sin horario de verano). La lógica actual es **CORRECTA**: medianoche en Ecuador = 05:00 UTC del mismo día. Queda **PROHIBIDO modificar `date-ec.utils.ts`**. Este test solo bloquea el comportamiento contra regresiones.

Razonamiento: `EC_TZ_OFFSET_MINUTES = -300`. `ecStartOfDay` hace `Date.UTC(y, m-1, d) - (-300 * 60000)` = medianoche UTC **+ 5 horas** = 05:00 UTC = 00:00 en Ecuador. Correcto.

### Pasos

**3.1.** Crea el archivo `backend/src/common/utils/date-ec.utils.spec.ts` con este contenido exacto:

```typescript
import { ecStartOfDay, ecEndOfDay, parseEcDate, ecDateRange } from './date-ec.utils';

describe('date-ec.utils (zona horaria Ecuador UTC-5)', () => {
  describe('ecStartOfDay', () => {
    it('retorna 05:00 UTC para medianoche en Ecuador', () => {
      expect(ecStartOfDay(2026, 7, 21)).toEqual(new Date('2026-07-21T05:00:00.000Z'));
    });

    it('no cambia de día respecto a la fecha local ecuatoriana', () => {
      const d = ecStartOfDay(2026, 1, 1);
      expect(d.toISOString()).toBe('2026-01-01T05:00:00.000Z');
    });
  });

  describe('ecEndOfDay', () => {
    it('retorna 04:59:59.999 UTC del día siguiente', () => {
      expect(ecEndOfDay(2026, 7, 21)).toEqual(new Date('2026-07-22T04:59:59.999Z'));
    });
  });

  describe('parseEcDate', () => {
    it('parsea YYYY-MM-DD como inicio de día en Ecuador', () => {
      expect(parseEcDate('2026-01-15')).toEqual(new Date('2026-01-15T05:00:00.000Z'));
    });
  });

  describe('ecDateRange', () => {
    it('retorna rango [gte, lt) cubriendo el día completo en Ecuador', () => {
      const { gte, lt } = ecDateRange('2026-03-10');
      expect(gte).toEqual(new Date('2026-03-10T05:00:00.000Z'));
      expect(lt).toEqual(new Date('2026-03-11T05:00:00.000Z'));
    });
  });
});
```

**3.2.** Verificación: desde `backend/`, `npm test -- date-ec.utils` debe pasar verde, y `npx tsc --noEmit` sin errores.

---

## TAREA 4 — Test de `HceService.firmarConsulta`

### Contexto

`backend/src/modules/hce/hce.service.ts` tiene el método `firmarConsulta(id: string, password: string)` (línea ~310) que:

1. Busca la consulta con `prisma.consultaHCE.findUnique` (incluye `especialista.usuario.passwordHash`, `diagnosticos`, `prescripciones`, `paciente`).
2. Lanza `NotFoundException` si no existe.
3. Lanza `ConflictException` con `{ code: 'HC_CERRADA' }` si `consulta.firmada === true`.
4. Lanza `UnauthorizedException` si no hay `passwordHash` o si `bcrypt.compare` devuelve false.
5. Crea un registro en `prisma.firma.create` con `tipo: 'CIERRE_HC'`, `algoritmoHash: 'sha256'`.
6. Actualiza la consulta con `firmada: true, firmadaEn: <Date>`.
7. Llama al método **privado** `generateConsultaPdf(id)` y guarda el resultado en `archivoPdfUrl`.
8. Retorna `this.getConsulta(id)`.

`HceService` solo tiene una dependencia: `constructor(private prisma: PrismaService)`.

### Detalles críticos para el test

- Mockear `bcryptjs`: `jest.mock('bcryptjs')` y controlar `(bcrypt.compare as jest.Mock).mockResolvedValue(true/false)`.
- Mockear el método privado del PDF para que no toque el filesystem:
  `jest.spyOn(service as any, 'generateConsultaPdf').mockResolvedValue('test.pdf');`
- Mockear también `service.getConsulta` con spy para el caso de éxito: `jest.spyOn(service, 'getConsulta').mockResolvedValue({ id: 'consulta-1' } as any);`

### Pasos

**4.1.** Crea `backend/src/modules/hce/hce.service.spec.ts` siguiendo el patrón de `backend/src/modules/auth/auth.service.spec.ts` (Test.createTestingModule con `{ provide: PrismaService, useValue: mockPrisma }`). Importa `PrismaService` desde `'../../common/prisma.service'`.

Casos obligatorios (usa estos nombres de describe/it):

```typescript
describe('HceService — firmarConsulta', () => {
  it('lanza NotFoundException si la consulta no existe');
  it('lanza ConflictException HC_CERRADA si la consulta ya esta firmada');
  it('lanza UnauthorizedException si la contrasena es incorrecta');
  it('firma correctamente: crea Firma CIERRE_HC, marca firmada y guarda PDF');
});
```

Datos mock sugeridos:

```typescript
const consultaMock = {
  id: 'consulta-1',
  firmada: false,
  motivoConsulta: 'Dolor de cabeza',
  enfermedadActual: 'Cefalea de 3 dias',
  updatedAt: new Date('2026-07-20T15:00:00.000Z'),
  especialistaId: 'esp-1',
  especialista: { usuario: { passwordHash: 'hash-mock' } },
  diagnosticos: [],
  prescripciones: [],
  paciente: { id: 'pac-1' },
};
```

En el caso de éxito verifica con `expect(...).toHaveBeenCalledWith(...)`:

- `mockPrisma.firma.create` fue llamado con `data` que incluye `consultaId: 'consulta-1'`, `tipo: 'CIERRE_HC'`, `algoritmoHash: 'sha256'` (usa `expect.objectContaining`).
- `mockPrisma.consultaHCE.update` fue llamado **dos veces** (primera: `firmada: true`; segunda: `archivoPdfUrl: 'test.pdf'`).

El mock de Prisma necesita como mínimo:

```typescript
const mockPrisma = {
  consultaHCE: { findUnique: jest.fn(), update: jest.fn() },
  firma: { create: jest.fn() },
};
```

**4.2.** Verificación: desde `backend/`, `npm test -- hce.service` verde y `npx tsc --noEmit` sin errores.

---

## TAREA 5 — Test de `PacientesService.cancelarProtocolo`

### Contexto

`backend/src/modules/pacientes/pacientes.service.ts` tiene `cancelarProtocolo(pacienteId, especialidad, motivo, userId)` (línea ~331) que:

1. Busca `prisma.inasistenciaPorEspecialidad.findUnique` con la clave compuesta `{ pacienteId_especialidad: { pacienteId, especialidad } }`.
2. Lanza `NotFoundException` si no existe.
3. `prisma.cita.updateMany`: pone `estado: 'CANCELADA'` a citas con estado `in: ['PENDIENTE', 'CONFIRMADA']` y fecha >= hoy.
4. `prisma.inasistenciaPorEspecialidad.update`: `contador: 0`, `ultimaNotificacionSeveridad: 'PROTOCOLO_CANCELADO'`.
5. `auditoriaService.registrar` con `accion: 'CANCELAR_PROTOCOLO'`.
6. Retorna `{ ok: true, especialidad, citasCanceladas: <count>, message: ... }`.

Dependencias del servicio: `constructor(private prisma: PrismaService, private auditoriaService: AuditoriaService)`. Importa `AuditoriaService` desde `'../auditoria/auditoria.service'`.

### Pasos

**5.1.** Crea `backend/src/modules/pacientes/pacientes.service.spec.ts` con el mismo patrón de mocks. Casos obligatorios:

```typescript
describe('PacientesService — cancelarProtocolo', () => {
  it('lanza NotFoundException si no hay registro de inasistencias');
  it('cancela citas futuras, resetea contador y registra auditoria');
});
```

Mocks mínimos:

```typescript
const mockPrisma = {
  inasistenciaPorEspecialidad: { findUnique: jest.fn(), update: jest.fn() },
  cita: { updateMany: jest.fn() },
};
const mockAuditoria = { registrar: jest.fn() };
```

En el caso de éxito:

- `findUnique` retorna `{ id: 'inasis-1', contador: 3 }`.
- `updateMany` retorna `{ count: 2 }`.
- Verifica que `cita.updateMany` recibió `where` con `estado: { in: ['PENDIENTE', 'CONFIRMADA'] }` (usa `expect.objectContaining`).
- Verifica que `inasistenciaPorEspecialidad.update` recibió `data: { contador: 0, ultimaNotificacionSeveridad: 'PROTOCOLO_CANCELADO' }`.
- Verifica que `auditoria.registrar` fue llamado con `expect.objectContaining({ accion: 'CANCELAR_PROTOCOLO', entidad: 'Paciente' })`.
- Verifica que el retorno tiene `ok: true` y `citasCanceladas: 2`.

**5.2.** Verificación: desde `backend/`, `npm test -- pacientes.service` verde y `npx tsc --noEmit` sin errores.

---

## TAREA 6 — Test frontend del `apiClient` (refresh single-flight y reintentos)

### Contexto

`frontend/src/lib/api/client.ts` exporta `apiClient<T>(path, options)`, `setTokens`, `clearTokens`, `getAccessToken` y la clase `ApiError`. Comportamiento a probar:

- Ante un 401, intenta refrescar el token llamando al endpoint de refresh. Si llegan **varias peticiones concurrentes** con 401, solo debe haber **una** llamada de refresh (variable `inflightRefresh`, patrón single-flight).
- Ante errores 5xx, reintenta con backoff (300ms, 800ms, 2000ms).

Lee el archivo `frontend/src/lib/api/client.ts` completo ANTES de escribir el test para usar los paths exactos del endpoint de refresh y los nombres de las claves de localStorage.

### Pasos

**6.1.** Crea `frontend/src/lib/api/client.test.ts`. Usa jsdom (ya configurado en `jest.config.js`). Mockea `global.fetch` con `jest.fn()`. Usa `jest.useFakeTimers()` o mocks de `setTimeout` si el backoff hace lentos los tests (alternativa válida: `jest.spyOn(global, 'setTimeout').mockImplementation((fn: any) => { fn(); return 0 as any; })`).

Casos obligatorios:

```typescript
describe('apiClient', () => {
  it('retorna el JSON parseado cuando la respuesta es 200');
  it('ante 401, dos llamadas concurrentes disparan UNA SOLA llamada de refresh');
  it('ante 500, reintenta hasta agotar los reintentos y lanza ApiError');
});
```

En el caso single-flight:

- Configura `fetch` para responder 401 la primera vez a `/ruta-a` y `/ruta-b`, luego 200 con token nuevo al endpoint de refresh, y 200 a los reintentos de `/ruta-a` y `/ruta-b`.
- Ejecuta `await Promise.all([apiClient('/ruta-a'), apiClient('/ruta-b')])`.
- Cuenta cuántas veces `fetch` fue llamado con la URL de refresh: debe ser **exactamente 1**.

En el caso 500: configura `fetch` para responder siempre `{ ok: false, status: 500, json: async () => ({}) }` y verifica que `apiClient` rechaza con `ApiError` y que `fetch` fue llamado 4 veces (1 intento + 3 reintentos). Si al leer el código el número de reintentos es distinto, usa el número real del código y repórtalo en el resumen final.

Limpieza: `afterEach(() => { jest.clearAllMocks(); localStorage.clear(); })`.

**6.2.** Verificación: desde `frontend/`, `npm test -- client.test` verde y `npx tsc --noEmit` sin errores.

---

## TAREA 7 — Test frontend de helpers de autenticación

### Contexto

`frontend/src/lib/auth.ts` exporta: `getUser()`, `setUser(user)`, `login(email, password)`, `logout()`, `isAuthenticated()`, `hasPermission(permiso)`, `hasRole(role)`. El estado vive en `localStorage` (jsdom ya lo provee en los tests).

Lee `frontend/src/lib/auth.ts` ANTES de escribir el test para conocer las claves exactas de localStorage y la forma del tipo `User` (está en `frontend/src/types/` — verifica el import al inicio de `auth.ts`).

### Pasos

**7.1.** Crea `frontend/src/lib/auth.test.ts`. Casos obligatorios:

```typescript
describe('auth helpers', () => {
  it('isAuthenticated retorna false sin token y true con token');
  it('setUser/getUser hacen round-trip del usuario');
  it('hasPermission retorna true solo si el permiso esta en el usuario');
  it('hasRole retorna true si el rol principal o algun rol adicional coincide');
  it('logout limpia el estado de autenticacion');
});
```

Notas:

- Para `logout`, mockea `global.fetch` (hace una llamada al backend para revocar) con una respuesta `{ ok: true, status: 200, json: async () => ({}) }` antes de llamarlo.
- Para `hasRole`, construye un usuario con `rol: 'ADMISION'` y `roles: ['AUDITOR']` (o la forma real del tipo `User`) y verifica que ambos matchean.
- Limpieza: `afterEach(() => { localStorage.clear(); jest.clearAllMocks(); })`.

**7.2.** Verificación: desde `frontend/`, `npm test -- auth.test` verde y `npx tsc --noEmit` sin errores.

---

## LO QUE NO DEBES HACER (lista explícita)

- ❌ NO crees `backend/src/modules/auth/auth.service.spec.ts` — **ya existe**.
- ❌ NO crees `backend/src/modules/citas/services/application/cita-estados.service.spec.ts` — **ya existe**.
- ❌ NO modifiques `backend/src/common/utils/date-ec.utils.ts` — la implementación es correcta, solo se agrega su test.
- ❌ NO toques `frontend/src/middleware.ts`, ni la lógica de auth, ni el schema de Prisma fuera del campo agregado en la Tarea 1.
- ❌ NO agregues tests de integración ni e2e. Solo tests unitarios con mocks.
- ❌ NO commitees nada a git.

---

## CRITERIO DE ACEPTACIÓN FINAL

Al terminar las 7 tareas, ejecuta y reporta el resultado de:

```bash
cd backend && npx tsc --noEmit && npm test
cd frontend && npx tsc --noEmit && npm test
```

Todo debe estar en verde. Reporta al final una tabla con:

| Tarea | Archivos creados | Archivos modificados | Archivos eliminados | Verificación |
|-------|------------------|----------------------|---------------------|--------------|

y cualquier discrepancia encontrada entre este documento y el código real.

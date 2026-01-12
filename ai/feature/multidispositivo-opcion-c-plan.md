---
id: multidispositivo-opcion-c
date: 2026-01-12
status: proposed
authors: [Implementation Planner]
---

# Implementation Plan - Multi-dispositivo (Opción C: `setup → ongoing → completed`) + reanudar + lock por dispositivo

## 1. Context & Analysis

- **Goal**: Permitir que una partida pueda **crearse (setup)**, **empezar realmente al primer tiro (ongoing)**, **finalizar (completed)** y **reanudar** desde cualquier dispositivo; evitando estados “basura” en admin y evitando que dos dispositivos controlen el mismo match a la vez.
- **Tech Stack**: Next.js 16 App Router, React 19, TypeScript 5.6, Prisma/PostgreSQL, Zod, shadcn/ui, Vitest.
- **Architecture**:
    - Estado vivo del juego: cliente (`GameController`).
    - Persistencia: BD (tablas `matches`, `throws`, `match_participants`), rehidratación via `src/lib/game/loader.ts`.
    - Mutaciones: Server Actions en `src/app/actions/*` protegidas por `requireAdminSession()`.

### Hallazgos clave (del código actual)

1. **Ya hay persistencia en BD**:
    - `createMatch()` crea fila en `matches` con `status: "ongoing"`.
    - Cada throw se persiste con `registerThrowForPlayer()`.
    - `getMatchState()` reconstruye el estado reproduciendo throws.

2. **No existe flujo de multi-dispositivo completo**:
    - Para reanudar en otro dispositivo hace falta descubrir el `matchId` (hoy solo está en la URL).
    - No hay control de concurrencia: dos dispositivos podrían registrar throws en el mismo match.

3. **Calibración está “partida” en dos modelos**:
    - El input mapping usa `CalibrationConfig` (centerX/centerY/scale/rotation) en `src/lib/game/calibration.ts`.
    - La persistencia de calibración usa otro shape (`scaleX/offsetX/matrix`) en `src/lib/validation/device-config.ts`.
    - `GameController` actualmente usa auto-calibración (`getAutoCalibrationFromRect`) e ignora `DeviceConfig`.

4. **`Match.status` es `String` en Prisma**, así que introducir `setup`/`ongoing` es un cambio lógico (no enum), pero hay que alinear UI y acciones.

## 2. Proposed Changes

### File Structure

```tree
prisma/
  schema.prisma (modify)
  migrations/
    *_match_setup_and_device_lock/ (new)

src/
  app/
    actions/
      matches.ts (modify)
      device-config.ts (modify)
      devices.ts (new)
    (admin)/
      matches/page.tsx (modify)
  components/
    admin/
      MatchRowActions.tsx (new)
    game/
      GameController.tsx (modify)
      modals/CalibrationModal.tsx (modify)
  lib/
    device/
      device-id.ts (new)
      device-lock.ts (new)
    game/
      loader.ts (modify)
  types/
    actions/
      devices.ts (new)
      matches.ts (modify)
    models/
      devices.ts (new)
      matches.ts (new)

tests/
  device/
    device-lock.test.ts (new)

docs/
  architecture/
    README.md (modify)
    multiplayer-device-lock.md (new)
```

## 3. Implementation Steps

### Phase 1: Modelo de datos (Prisma) para multi-dispositivo

- [ ] **Step 1.1**: Modificar `prisma/schema.prisma` (Match lifecycle + lock)
    - **Details**: Añadir campos a `Match`: `status` seguirá siendo `String`, pero documentar estados válidos `setup|ongoing|completed|aborted`. Añadir `controllerDeviceId String?`, `controllerLeaseUntil DateTime?`, `lastActivityAt DateTime?`. Añadir índices por `status` y `controllerDeviceId` si aplica.
    - **Verification**: `pnpm prisma validate` sin errores.

- [ ] **Step 1.2**: Crear modelo `Device` en `prisma/schema.prisma`
    - **Details**: Nuevo modelo `Device` con `id String @id`, `name String?`, `createdAt`, `lastSeenAt`. Se usará para auditoría/UX (mostrar “controlado por X”).
    - **Verification**: Prisma genera cliente y se puede `upsert` un device.

- [ ] **Step 1.3**: Hacer `DeviceConfig` multi-dispositivo
    - **Details**: Cambiar estrategia de `DeviceConfig` (hoy single-row `id Int @default(1)`). Propuesta: migrar a PK `deviceId String @id` y guardar calibration/preferences por dispositivo. Incluir plan de migración de datos: copiar fila existente a `deviceId='default'`.
    - **Verification**: Migración aplica y `getDeviceConfig(deviceId)` devuelve config.

- [ ] **Step 1.4**: Crear migración SQL segura
    - **Details**: Crear `prisma/migrations/*_match_setup_and_device_lock/migration.sql` con pasos idempotentes: añadir columnas nuevas a `matches`, crear `devices`, transformar `device_configs` a por-dispositivo con migración de datos.
    - **Verification**: `pnpm prisma migrate dev` aplica sin pérdida de datos local.

### Phase 2: Identidad de dispositivo (cliente) y registro (servidor)

- [ ] **Step 2.1**: Crear `src/lib/device/device-id.ts`
    - **Details**: Implementar `getOrCreateDeviceId()` (client-only) con `localStorage` y fallback si no disponible. Usar `crypto.randomUUID()`.
    - **Verification**: En navegador, el deviceId persiste tras refresh.

- [ ] **Step 2.2**: Crear Server Action `src/app/actions/devices.ts`
    - **Details**: Añadir `registerDevice({ deviceId, name? })` que hace `upsert` en `Device` y actualiza `lastSeenAt`. Proteger con `requireAdminSession()`.
    - **Verification**: Llamada desde cliente devuelve `{ success:true }`.

- [ ] **Step 2.3**: Tipos de actions y modelos
    - **Details**: Añadir tipos en `src/types/models/devices.ts` y `src/types/actions/devices.ts`. Actualizar `src/types/index.ts` exports si aplica.
    - **Verification**: No hay tipos inline en acciones/componentes nuevos.

### Phase 3: Opción C - lifecycle `setup → ongoing` en el primer throw

- [ ] **Step 3.1**: Cambiar `createMatch()` a `status: "setup"`
    - **Details**: En `src/app/actions/matches.ts`, crear la partida con `status:"setup"`, `winnerId:null`, `endedAt:null`, `lastActivityAt:null`. Mantener equipos/participantes igual.
    - **Verification**: Crear partida desde UI produce match en BD con `setup`.

- [ ] **Step 3.2**: Promover a `ongoing` en el primer throw
    - **Details**: En `registerThrowForPlayer()` y `registerThrow()`, dentro de transacción: si el match está en `setup`, al crear el primer `Throw` actualizar `Match.status="ongoing"` y `startedAt=throw.timestamp` (opcional) + `lastActivityAt=throw.timestamp`.
    - **Verification**: Match pasa de `setup` a `ongoing` al primer dardo.

- [ ] **Step 3.3**: Mantener finalización robusta
    - **Details**: Asegurar que en `isWin=true` se setea `completed/winnerId/endedAt` como ya se hace. Añadir `lastActivityAt` en cada throw.
    - **Verification**: Al ganar, status y tiempos quedan consistentes.

### Phase 4: Lock/lease por dispositivo (multi-dispositivo seguro)

- [ ] **Step 4.1**: Crear helper puro `src/lib/device/device-lock.ts`
    - **Details**: Implementar funciones puras: `canClaimLock(now, leaseUntil)`, `nextLeaseUntil(now)`, `isLockValid(now, leaseUntil)`. Definir TTL (p.ej. 30s–2min) como constante.
    - **Verification**: Tests unitarios cubren expiración y renovación.

- [ ] **Step 4.2**: Extender payload de throws con `deviceId`
    - **Details**: Añadir `deviceId` a inputs de `registerThrowForPlayer` y `registerThrow` (Zod y tipos). El cliente debe enviarlo siempre.
    - **Verification**: TS fuerza pasar `deviceId` desde `GameController`.

- [ ] **Step 4.3**: Enforzar lock en `registerThrow*`
    - **Details**: Antes de insertar throw: cargar `Match.controllerDeviceId/controllerLeaseUntil/status`. Si `completed/aborted` -> rechazar. Si no hay `controllerDeviceId` o lease expiró -> asignar al `deviceId` actual. Si está asignado a otro device con lease válida -> rechazar con error claro.
    - **Verification**: Dos devices no pueden tirar simultáneamente.

- [ ] **Step 4.4**: Acciones explícitas de control
    - **Details**: Añadir `claimMatchControl(matchId, deviceId)` y `releaseMatchControl(matchId, deviceId)` en `src/app/actions/matches.ts`. `claim` renueva lease, `release` limpia el controlador si coincide.
    - **Verification**: UI puede “tomar control” al reanudar.

- [ ] **Step 4.5**: Takeover admin (manual)
    - **Details**: Añadir `forceTakeoverMatch(matchId, deviceId)` (solo admin) que reasigna el controlador aunque haya otro, registrando `lastActivityAt`. Requiere confirmación en UI.
    - **Verification**: Recuperación sencilla si un device murió.

### Phase 5: UX de reanudar + limpieza en Admin (evitar ruido)

- [ ] **Step 5.1**: Filtrado por estado en `src/app/(admin)/matches/page.tsx`
    - **Details**: Añadir tabs/filtros: “Completadas” (default), “En juego” (`ongoing`), “Preparadas” (`setup`). Mantener badge y ganador. No mostrar `setup/ongoing` en la vista por defecto.
    - **Verification**: Admin abre “Partidas” y ve solo completadas por defecto.

- [ ] **Step 5.2**: Acciones por fila (reanudar/abortar/takeover)
    - **Details**: Crear componente `src/components/admin/MatchRowActions.tsx` con botones: “Reanudar”, “Abortar”, “Tomar control”. Usar Server Actions correspondientes y `revalidatePath("/matches")`.
    - **Verification**: Desde admin se puede reanudar una ongoing y abortar setup.

- [ ] **Step 5.3**: Server Action `abortMatch(matchId)`
    - **Details**: Implementar abortado: `status="aborted"`, `endedAt=now`, limpiar lock. No borrar throws (audit). Solo admin.
    - **Verification**: Match no aparece en “En juego” tras abortar.

- [ ] **Step 5.4**: Descubrimiento multi-dispositivo
    - **Details**: Añadir en admin “En juego” un CTA “Copiar enlace” (matchId) y opcional QR (si se añade librería). El enlace abre `/game?matchId=...`.
    - **Verification**: Otro dispositivo puede abrir el enlace y solicitar control.

### Phase 6: Calibración por dispositivo (imprescindible en multi-dispositivo)

- [ ] **Step 6.1**: Unificar el modelo de calibración
    - **Details**: Decidir un único shape. Recomendación: persistir `CalibrationConfig` (`centerX/centerY/scale/rotation`) y adaptar `deviceCalibrationSchema` y `DeviceConfig` para guardarlo, o añadir `calibrationV2` manteniendo compatibilidad.
    - **Verification**: No se rompe `transformCoordinates` y existe una fuente de verdad.

- [ ] **Step 6.2**: Hacer `getDeviceConfig(deviceId)`
    - **Details**: En `src/app/actions/device-config.ts`, aceptar `deviceId` y operar por dispositivo (no `findFirst`). Crear config por defecto si no existe.
    - **Verification**: Dos devices obtienen configs independientes.

- [ ] **Step 6.3**: Consumir calibración real en juego
    - **Details**: En `GameController`/`DartboardCanvas`, reemplazar auto-calibración por calibración persistida del device (fallback a auto si no hay). Asegurar que la calibración no depende de `window.innerWidth/Height` salvo en el modo de calibración.
    - **Verification**: Tras calibrar en device A, device B no se ve afectado.

- [ ] **Step 6.4**: Actualizar `CalibrationModal` para deviceId
    - **Details**: Obtener `deviceId` (lib) y guardar calibración en `updateCalibration(deviceId, data)`. Ajustar copy: “Calibración de este dispositivo”.
    - **Verification**: Guardar calibración no pisa la de otro dispositivo.

### Phase 7: Observabilidad y protección adicional

- [ ] **Step 7.1**: Añadir `lastActivityAt` en cada throw
    - **Details**: En `registerThrow*`, actualizar `lastActivityAt` siempre. Renovar `controllerLeaseUntil` en cada throw.
    - **Verification**: Admin puede ordenar por actividad y detectar matches “colgados”.

- [ ] **Step 7.2**: Respuesta de error estructurada para lock
    - **Details**: Normalizar errores: `message` claro (“Partida controlada por otro dispositivo”) y opcional `code` (`LOCKED_BY_OTHER_DEVICE`).
    - **Verification**: UI puede mostrar un modal con “Tomar control”.

### Phase 8: Tests y verificación

- [ ] **Step 8.1**: Tests unitarios de lock
    - **Details**: Crear `tests/device/device-lock.test.ts` para TTL, expiración y renovación.
    - **Verification**: `pnpm test` pasa.

- [ ] **Step 8.2**: Plan de pruebas manual multi-dispositivo
    - **Details**: Checklist: (1) crear match (setup) en A, (2) abrir link en B y “tomar control”, (3) A intenta tirar y recibe bloqueo, (4) B tira y persiste, (5) ganar y ver completed en admin, (6) abortar match setup.
    - **Verification**: Todos los pasos reproducibles.

- [ ] **Step 8.3**: Documentación de arquitectura
    - **Details**: Añadir `docs/architecture/multiplayer-device-lock.md` con estados, lock TTL, takeover, y compatibilidad. Enlazar desde `docs/architecture/README.md`.
    - **Verification**: Docs tienen enlaces bidireccionales y explican decisiones.

## 4. Verification Plan

- [ ] `pnpm lint`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] Validación manual multi-dispositivo (2 navegadores o 2 dispositivos):
    - [ ] Un match se crea como `setup` y no aparece en “Completadas”.
    - [ ] El primer throw cambia a `ongoing`.
    - [ ] Lock: solo un device puede registrar throws con lease válida.
    - [ ] Takeover funciona y se audita.
    - [ ] Calibración es por-dispositivo.
    - [ ] Reanudar desde admin funciona usando enlace `/game?matchId=...`.

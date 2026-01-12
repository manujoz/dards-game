[← Back to Main](../../README.md) | [← Arquitectura](./README.md) | [Server Actions](../api/server-actions.md) | [Motor de juego](./game-engine.md)

---

## Índice

- [Objetivo](#objetivo)
- [Ciclo de vida de una partida](#ciclo-de-vida-de-una-partida)
- [Identidad de dispositivo](#identidad-de-dispositivo)
- [Lock por dispositivo (lease/TTL)](#lock-por-dispositivo-leasettl)
- [Acciones de control (claim/release/takeover)](#acciones-de-control-claimreleasetakeover)
- [Errores esperables](#errores-esperables)
- [Checklist manual multi-dispositivo](#checklist-manual-multi-dispositivo)

---

## Objetivo

Permitir **reanudar una partida desde otro dispositivo** y evitar que dos pantallas registren tiros simultáneamente sobre el mismo `matchId`.

El patrón se basa en un **lease temporal (TTL)** asociado al match, que se renueva con actividad (throws) o mediante una acción explícita de “tomar control”.

## Ciclo de vida de una partida

Los estados válidos (lógicos) de `Match.status` son:

- `setup`: partida creada, pero todavía sin tiros persistidos.
- `ongoing`: partida en juego (se promociona desde `setup` al primer throw).
- `completed`: partida finalizada con ganador.
- `aborted`: partida abortada manualmente (sin borrar throws, solo audit).

Notas:

- `startedAt` representa la **fecha de creación**.
- `lastActivityAt` representa la **última actividad real** (throws o takeover), útil para ordenar y detectar matches “colgados”.

## Identidad de dispositivo

Cada dispositivo genera y persiste un `deviceId` (UUID) en el cliente. Ese `deviceId`:

- se envía en cada registro de throw;
- se utiliza para reclamar/liberar el control del match;
- permite mantener calibración y preferencias por dispositivo (ver `DeviceConfig`).

## Lock por dispositivo (lease/TTL)

El lock vive en el propio `Match`:

- `controllerDeviceId`: UUID del dispositivo controlador (o `null`).
- `controllerLeaseUntil`: instante de expiración del lease (o `null`).

TTL:

- Valor actual: `60_000ms` (60s) (`CONTROLLER_LEASE_TTL_MS`).

Reglas puras (helpers):

- Un lock se considera válido si `leaseUntil > now`.
- Se puede reclamar el lock si `leaseUntil <= now` o no existe (`null/undefined`).

Enforcement en servidor:

- Antes de crear un throw, se verifica:
    - Si la partida está `completed` o `aborted` → se rechaza.
    - Si `controllerDeviceId` es otro dispositivo y el lease es válido → se rechaza.
- El claim/renovación se hace con una operación atómica (update condicional) para reducir carreras:
    - Permite reclamar si el lock está vacío, expirado o ya pertenece al mismo `deviceId`.

Renovación:

- Cada throw renueva `controllerLeaseUntil`.
- `claimMatchControl` y `forceTakeoverMatch` renuevan el lease.

## Acciones de control (claim/release/takeover)

Acciones (Server Actions) relevantes:

- `claimMatchControl({ matchId, deviceId })`
    - Reclama el lock si está libre/expirado, o si ya es del propio dispositivo.
    - Si está controlado por otro dispositivo con lease válido, devuelve error con `code`.

- `releaseMatchControl({ matchId, deviceId })`
    - Libera el lock solo si el controlador actual coincide con el dispositivo.

- `forceTakeoverMatch({ matchId, deviceId })`
    - Reasigna el control aunque otro dispositivo lo tenga activo.
    - Debe usarse como recuperación (p.ej. dispositivo anterior “murió”).

- `abortMatch(matchId)`
    - Cambia `status` a `aborted`, limpia lock y marca `endedAt/lastActivityAt`.

## Errores esperables

Cuando el match está bloqueado por otro dispositivo:

- `message`: "Partida controlada por otro dispositivo"
- `code`: `LOCKED_BY_OTHER_DEVICE`

Cuando el match ya no admite cambios:

- `message`: "La partida ya está finalizada"

## Checklist manual multi-dispositivo

Checklist recomendado (2 navegadores/perfiles o 2 dispositivos reales):

1. En dispositivo A, crear partida → queda en `setup`.
2. En A, registrar el primer throw → pasa a `ongoing`.
3. En dispositivo B, abrir el mismo match y ejecutar “Tomar control”.
4. En A, intentar registrar un throw → debe bloquear con mensaje de lock.
5. En B, registrar throws → deben persistir y renovar el lease.
6. Finalizar (win) → el match pasa a `completed` y aparece en admin como completada.
7. (Opcional) En admin, abortar una partida `setup` y verificar que no vuelve a aparecer como activa.

---

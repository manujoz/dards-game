---
id: admin-login-y-guard
date: 2026-01-11
status: completed
authors: [Implementation Planner]
---

# Implementation Plan - Login de Admin + Guard global (todo excepto home)

## 1. Context & Analysis

- **Goal**: Requerir login persistente de un `Player` con `admin=true` para acceder a cualquier ruta distinta de `/`. En la home (`/`) se muestra un formulario de login y solo si hay sesión admin se muestra el botón **Empezar partida**.
- **Tech Stack**: Next.js 16 (App Router), React 19, TypeScript, Prisma/PostgreSQL, Zod, Tailwind + shadcn/ui.
- **Architecture**: Autenticación basada en **cookie HttpOnly** con **JWT firmado (HS256)** verificable en Edge Middleware (sin acceder a Prisma). Las Server Actions validan la sesión y (opcionalmente) revalidan que el player sigue siendo admin.

## 2. Proposed Changes

### File Structure

```tree
prisma/
  schema.prisma (modify)
    migrations/
        *_add_player_password/ (new)

src/
    middleware.ts (new)
  app/
    page.tsx (modify)
    actions/
      auth.ts (new)
      players.ts (modify)
      matches.ts (modify)
      device-config.ts (modify)
      rankings.ts (modify)
    (admin)/
      account/
        page.tsx (new)
  components/
    home/
      AdminLoginForm.tsx (new)
    admin/
      AdminSidebar.tsx (modify)
    ui/
      checkbox.tsx (new, si no existe)
  lib/
    auth/
      session.ts (new)
    validation/
      auth.ts (new)

src/types/
  actions/
    auth.ts (new)
  components/
    home.ts (modify, si aplica)

tests/
  auth/
    session.test.ts (new)

.env.local (modify/add)
```

## 3. Implementation Steps

### Phase 1: Modelo de datos y dependencias

- [x] **Step 1.1**: Actualizar `prisma/schema.prisma`
    - **Details**: Añadir `password String?` al modelo `Player`. Mantener `admin Boolean @default(false)`.
    - **Verification**: `pnpm prisma:generate` genera el cliente sin errores y TypeScript reconoce `player.password`.

- [x] **Step 1.1b**: Crear migración para `players.password` y aplicarla localmente
    - **Details**: Crear una migración Prisma que añada la columna `password` (nullable) en la tabla `players`.
    - **Why**: El deploy ejecuta `pnpm prisma:migrate:deploy` (ver `build:netlify`). Sin migración, la columna no existirá en la base de datos.
    - **Verification**: Existe una carpeta de migración `*_add_player_password` con el SQL correspondiente (y se aplica en entornos con DB configurada).

- [x] **Step 1.2**: Añadir dependencias de seguridad en `package.json`
    - **Details**: Añadir `jose` (JWT compatible con Edge) y `bcryptjs` (hash/compare en Node) como dependencies.
    - **Verification**: `pnpm install` y `pnpm lint` pasan.

- [x] **Step 1.3**: Añadir secreto de sesión a `.env.local`
    - **Details**: Añadir `AUTH_SECRET=` (string largo aleatorio). Documentar que también debe configurarse en Netlify.
    - **Verification**: Arranque local no falla por env missing (validación en runtime muestra error claro si falta).

### Phase 2: Sesión (JWT + cookie) y guard global

- [x] **Step 2.1**: Crear utilidades de sesión en `src/lib/auth/session.ts`
    - **Details**: Implementar `createSessionToken(payload)`, `verifySessionToken(token)`, y constantes de cookie (nombre, opciones). Payload mínimo: `{ playerId: string; nickname: string; admin: true }`.
    - **Verification**: Tests unitarios pueden firmar/verificar token con `AUTH_SECRET`.

- [x] **Step 2.2**: Crear middleware global `src/middleware.ts`
    - **Details**: Proteger todas las rutas excepto `/` y assets (`/_next`, `/favicon.ico`, `/assets`, `/sounds`). Si no hay cookie válida o `admin !== true`, redirigir a `/` (opcional: con `returnTo`).
    - **Verification**: Navegar a `/game` sin sesión redirige a `/`. Con sesión, permite acceso.

- [x] **Step 2.3**: Añadir helper de autorización para Server Actions
    - **Details**: En `src/lib/auth/session.ts` (o archivo hermano), añadir `requireAdminSession()` que lee cookie (via `cookies()`), verifica token, y devuelve `playerId`.
    - **Verification**: Cualquier server action que lo use falla con `{ success:false, message:"No autorizado" }` cuando no hay sesión.

### Phase 3: Login en Home (UI + Server Actions)

- [x] **Step 3.1**: Crear schemas de auth en `src/lib/validation/auth.ts`
    - **Details**: Zod para `login`: `nickname` (min 2, max 20) + `password` (min razonable). Normalizar nickname (trim) para login.
    - **Verification**: Tipos inferidos y validación rechaza inputs inválidos.

- [x] **Step 3.2**: Crear Server Actions en `src/app/actions/auth.ts`
    - **Details**: `loginAdmin({ nickname, password })`: buscar player por nickname con `mode:"insensitive"`, exigir `admin=true` y `password` presente, comparar con `bcryptjs.compare`, setear cookie HttpOnly con JWT (maxAge muy largo).
    - **Verification**: Login correcto establece cookie; login incorrecto retorna mensaje genérico.

- [x] **Step 3.3**: Añadir `logout()` en `src/app/actions/auth.ts`
    - **Details**: Borrar cookie (set maxAge 0 / expires). Devuelve `ActionResponse<void>`.
    - **Verification**: Tras logout, navegar a `/game` redirige a `/`.

- [x] **Step 3.4**: Crear componente `src/components/home/AdminLoginForm.tsx`
    - **Details**: Formulario client component con inputs nickname/password, llama `loginAdmin`, muestra errores. Mantener UX táctil.
    - **Verification**: En home, se puede loguear sin recargar manualmente.

- [x] **Step 3.5**: Modificar `src/app/page.tsx` para UI condicional
    - **Details**: Leer sesión server-side (usando `cookies()` + verify token) y: si hay sesión admin, mostrar `StartGameButton`; si no, mostrar `AdminLoginForm`.
    - **Verification**: El botón “Empezar partida” no aparece sin sesión admin.

### Phase 4: Endurecer Server Actions (no confiar en input del cliente)

- [x] **Step 4.1**: Proteger `src/app/actions/players.ts`
    - **Details**: En `createPlayer*`, `updatePlayerWithAvatar`, `deletePlayer`, llamar a `requireAdminSession()`. Eliminar dependencia de `performedByPlayerId` como “auth”; usar la sesión.
    - **Verification**: Sin cookie, las acciones devuelven `No autorizado` aunque se invoquen desde fuera.

- [x] **Step 4.2**: Proteger `src/app/actions/matches.ts`
    - **Details**: En `createMatch`, `registerThrow`, `undoLastThrow` (y otras mutaciones), exigir `requireAdminSession()`.
    - **Verification**: No se pueden crear partidas/registrar tiros sin sesión.

- [x] **Step 4.3**: Proteger `src/app/actions/device-config.ts`
    - **Details**: En `updateCalibration` y `updatePreferences`, exigir sesión admin.
    - **Verification**: Cambios de calibración quedan bloqueados sin sesión.

- [x] **Step 4.4**: Revisar lecturas sensibles (opcional)
    - **Details**: `getPlayers/getMatches/getRankings` pueden requerir sesión por consistencia. Aplicar si se exponen fuera de rutas protegidas.
    - **Verification**: Accesos a data desde endpoints server actions no exponen info sin sesión.

### Phase 5: Admin UX (logout, crear admin, cambiar password)

- [x] **Step 5.1**: UI de creación de admin con contraseña
    - **Details**: En `CreatePlayerDialog.tsx`, añadir checkbox “Admin”. Si está activo, mostrar campos obligatorios `password` y `confirmPassword` (con validación cliente) y enviarlos en `FormData`. Si no es admin, no mostrar ni enviar contraseña.
    - **Verification**: Al marcar “Admin”, aparecen ambos campos; desmarcar los oculta y no bloquea crear jugador normal.

- [x] **Step 5.2**: Validación y hash de contraseña al crear admin
    - **Details**: En `src/app/actions/players.ts` (`createPlayerWithAvatar`), leer `admin`, `password`, `confirmPassword`. Si `admin=true`, exigir password, exigir coincidencia con confirmación y guardar `player.password = bcryptHash`. Si `admin=false`, ignorar password aunque llegue.
    - **Verification**: Crear admin sin password o con confirmación distinta devuelve error de validación; crear admin válido guarda hash.

- [x] **Step 5.3**: Ajustar copy/ayudas en dialogs
    - **Details**: En `EditPlayerDialog.tsx` y `DeletePlayerDialog.tsx`, actualizar textos que dicen que admin solo se gestiona en DB (ya no aplica para creación).
    - **Verification**: UI no contradice el comportamiento real.

- [x] **Step 5.4**: Añadir sección “Cuenta/Seguridad”
    - **Details**: Crear `src/app/(admin)/account/page.tsx` con formulario “Cambiar contraseña” (password actual + nueva + confirmación). Solo para el usuario logueado.
    - **Verification**: La ruta funciona y está protegida por middleware.

- [x] **Step 5.5**: Server Action para cambiar password
    - **Details**: En `src/app/actions/auth.ts`, `changePassword({ currentPassword, newPassword })`: requireAdminSession, obtener player, comparar current, guardar nuevo hash en `player.password`.
    - **Verification**: Tras cambiar, se puede volver a loguear con la nueva contraseña.

- [x] **Step 5.6**: Añadir “Cerrar sesión” en `AdminSidebar.tsx`
    - **Details**: Debajo de “Volver al juego”, añadir botón que llama `logout()` y redirige a `/`.
    - **Verification**: Al pulsar, se pierde acceso a rutas protegidas.

### Phase 6: Testing, docs y bootstrap manual de passwords

- [x] **Step 6.1**: Añadir tests básicos de sesión en `tests/auth/session.test.ts`
    - **Details**: Probar firma/verificación JWT con secreto de test y que `admin:true` es requisito.
    - **Verification**: `pnpm test` pasa.

- [x] **Step 6.2**: Documentar setup en `README.md` o `docs/`
    - **Details**: Añadir sección: variables de entorno (`AUTH_SECRET`), columna `players.password`, y flujo de login.
    - **Verification**: Documentación es clara y reproducible.

- [x] **Step 6.3**: Instrucciones para hashear contraseña inicial (manual)
    - **Details**: Añadir un script simple `scripts/hash-password.js` (o doc con snippet) usando `bcryptjs.hash(password, saltRounds)` que imprima el hash para pegarlo en `players.password`.
    - **Verification**: Ejecutar el script devuelve un hash bcrypt válido y el login funciona con ese password.

## 4. Verification Plan

- [x] `pnpm lint`
- [x] `pnpm test`
- [x] `pnpm build`
- [ ] Manual:
    - Sin sesión: visitar `/game`, `/admin`, `/players` redirige a `/`.
    - En `/`: login con nickname (case-insensitive) + password correcto muestra “Empezar partida”.
    - Logout desde sidebar bloquea navegación de nuevo.
    - Crear jugador con “Admin” marcado crea `admin=true`.
    - Cambiar contraseña del usuario logueado requiere password actual y persiste.

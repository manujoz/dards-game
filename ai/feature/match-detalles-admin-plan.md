---
id: match-detalles-admin
date: 2026-01-12
status: proposed
authors: [Implementation Planner]
---

# Implementation Plan - Detalles de partida en Admin

## 1. Context & Analysis

- **Goal**: Añadir acción "Ver detalles" en todas las tablas de partidas y una vista de detalle bonita y responsive con estado, marcador por modo de juego, tiros por jugador/ronda y acciones disponibles según estado.
- **Tech Stack**: Next.js 16 (App Router), React 19, TypeScript, Prisma/Postgres, Tailwind, shadcn/ui.
- **Architecture**: Server Components para páginas (admin). Acciones mutables via Server Actions existentes. Componentes interactivos con "use client". Tipos en `src/types/components`.

## 2. Proposed Changes

### File Structure

```tree
src/
  app/
    (admin)/
      matches/
        [matchId]/
          page.tsx (new)
          loading.tsx (new)
  components/
    admin/
      MatchDetailsActions.tsx (new)
      MatchDetailsHeader.tsx (new)
      MatchDetailsScoreboard.tsx (new)
      MatchDetailsThrows.tsx (new)
  lib/
    game/
      match-state-from-details.ts (new)
    matches/
      match-details.ts (new)
  types/
    components/
      admin.ts (modify)
tests/
  matches/
    match-details.test.ts (new)
```

## 3. Implementation Steps

### Phase 1: Modelo y utilidades

- [ ] **Step 1.1**: Actualizar `src/types/components/admin.ts`
    - **Details**: Añadir props para nuevos componentes de detalle (header, acciones, scoreboard, throws) evitando tipos inline. Mantener comillas dobles y 4 espacios.
    - **Verification**: TypeScript compila sin `any` y sin props inline.

- [ ] **Step 1.2**: Crear `src/lib/game/match-state-from-details.ts`
    - **Details**: Implementar una función server-side que reconstruya `GameState` a partir de `MatchWithDetails` (sin queries) usando `GameEngine` + `getGameLogic`. No usar `requireAdminSession` aquí; la page server ya usa `getMatch()`.
    - **Verification**: La vista detalle puede renderizar marcador usando el estado reconstruido.

- [ ] **Step 1.3**: Crear `src/lib/matches/match-details.ts`
    - **Details**: Añadir helpers puros para agrupar tiros por jugador/ronda, detectar 0-based vs 1-based y derivar labels (p.ej. ronda visual = roundIndex + 1). Sin dependencias de React.
    - **Verification**: Tests unitarios cubren agrupación y etiquetado de rondas.

### Phase 2: Vista detalle (Admin)

- [ ] **Step 2.1**: Crear `src/app/(admin)/matches/[matchId]/page.tsx`
    - **Details**: Server Component: cargar `getMatch(matchId)`, mostrar header, resumen (estado/fechas/participantes), marcador (Scoreboard), tiros (tabla) y acciones según estado. Incluir botón "Volver" conservando query `view/returnTo` si viene.
    - **Verification**: Navegar desde `/matches` a detalle y volver funciona.

- [ ] **Step 2.2**: Crear `src/app/(admin)/matches/[matchId]/loading.tsx`
    - **Details**: Skeleton simple con Cards/blocks para evitar layout shift.
    - **Verification**: Al cargar el detalle se ve placeholder coherente.

- [ ] **Step 2.3**: Crear componentes UI en `src/components/admin/*`
    - **Details**: Implementar componentes: header, acciones (client), scoreboard y tiros. Mantener estilo visual del panel (sutileza, slate, cards) y responsive (scroll horizontal en tablas).
    - **Verification**: Pantalla se ve bien en mobile y desktop; no rompe layout del admin.

### Phase 3: Acción "Ver detalles" en tablas

- [ ] **Step 3.1**: Actualizar `src/components/admin/MatchRowActions.tsx`
    - **Details**: Añadir opción "Ver detalles" que navegue a `/matches/[matchId]` y mantener el resto de acciones para `ongoing/setup`.
    - **Verification**: En vistas "En juego" y "Preparadas" aparece "Ver detalles".

- [ ] **Step 3.2**: Actualizar `src/components/admin/AbortedMatchRowActions.tsx`
    - **Details**: Añadir opción "Ver detalles" y mantener "Deshacer abortado".
    - **Verification**: En vista "Abortadas" aparece "Ver detalles".

- [ ] **Step 3.3**: Actualizar `src/app/(admin)/matches/page.tsx`
    - **Details**: En vista "Completadas" mostrar acción "Ver detalles" en la celda Acciones (sin otras acciones). Mantener acciones personalizadas por vista.
    - **Verification**: En "Completadas" ya no aparece "-".

### Phase 4: Validación

- [ ] **Step 4.1**: Crear `tests/matches/match-details.test.ts`
    - **Details**: Tests para helpers de `src/lib/matches/match-details.ts` (agrupación y roundIndex + 1). Usar Vitest.
    - **Verification**: `pnpm test` pasa.

- [ ] **Step 4.2**: Verificación final
    - **Details**: Ejecutar `pnpm lint`, `pnpm test`, `pnpm build`.
    - **Verification**: Todo pasa sin errores.

## 4. Verification Plan

- [ ] `pnpm test`
- [ ] `pnpm lint`
- [ ] `pnpm build`
- [ ] Manual: `/matches` -> abrir detalle en cada tab (completadas/en juego/preparadas/abortadas), comprobar acciones según estado y responsive.

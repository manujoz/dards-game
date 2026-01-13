---
id: rankings-elo-por-modo-y-stats-agregadas
date: 2026-01-12
status: proposed
authors: [Implementation Planner]
---

# Implementation Plan - Rankings reales (ELO por modo + stats agregadas + variantes)

## 1. Context & Analysis

- **Goal**: Reemplazar el ranking placeholder por un ranking real, con **ELO por modo (y por variante)** + **métricas agregadas** (PPD, MPR, puntos/marcas, winrate), con badge **“Provisional”** cuando el jugador tenga pocas partidas.
- **Tech Stack**: Next.js App Router (Server Actions), TypeScript, Prisma + PostgreSQL, Vitest, Zod.
- **Architecture**: Persistir agregados y rating en DB para rendimiento. Calcular métricas por partida desde `Throw` al finalizar una partida. Mantener capacidad de **recompute** (backfill) para corregir inconsistencias o cambios de reglas.

¡NOTE!: El archivo .env.local ya existe y está configurado correctamente, no es necesario modificarlo a no ser que haya que añadir nuevas variables de entorno.

## 2. Proposed Changes

### File Structure

```tree
prisma/
  schema.prisma (modify)
  migrations/
    2026xxxx_add_rankings_elo_stats/ (new)

src/lib/rankings/
  variant-key.ts (new)
  match-metrics.ts (new)
  elo.ts (new)
  recompute.ts (new)

src/app/actions/
  rankings.ts (modify)
  matches.ts (modify)

src/app/(admin)/rankings/
  page.tsx (modify)

src/types/actions/
  rankings.ts (modify)

scripts/
  recompute-rankings.mjs (new)

tests/rankings/
  elo.test.ts (new)
  match-metrics-x01.test.ts (new)
  match-metrics-cricket.test.ts (new)
  variant-key.test.ts (new)
```

## 3. Implementation Steps

### Phase 1: Modelo de datos e índices (rendimiento)

- [x] **Step 1.1**: Añadir modelos de rankings en `prisma/schema.prisma`
    - **Details**: Crear `PlayerModeStats`, `PlayerModeRating`, `MatchResult` con clave `(playerId, gameId, variantKey)` y `MatchResult` por `(matchId, participantId)`. Incluir campos para wins, matches, dartsValid, pointsValid, marks, roundsPlayed, lastMatchAt. Añadir índices por `(gameId, variantKey)` y por `(playerId)`.
    - **Verification**: `prisma validate` y migración genera SQL.

- [x] **Step 1.2**: Crear migración Prisma para rankings
    - **Details**: Generar migration con tablas e índices. Añadir defaults (rating 1500) y timestamps. Considerar `variantKey` como `String` y `gameId` como `String` (alineado con `Match.gameId`).
    - **Verification**: `pnpm prisma migrate dev` aplica sin errores.

- [x] **Step 1.3**: Definir política de “match contabilizable”
    - **Details**: Documentar y codificar filtro: contar solo `Match.status="completed"`. Excluir `aborted`. Opcional: backfill para matches con `throws.isWin=true` y status incorrecto.
    - **Verification**: Tests unitarios de filtro + consulta DB de ejemplo.

### Phase 2: VariantKey (separación “pro” por variante)

- [x] **Step 2.1**: Implementar `variantKey` estable en `src/lib/rankings/variant-key.ts`
    - **Details**: Parsear `Match.variant` (JSON) y generar `variantKey` estable por `gameId`. Para `x01`, incluir campos relevantes (p.ej. startScore, outRule/doubleOut/masterOut). Para `cricket`, incluir flags relevantes si existen. Si no se puede parsear, usar `"unknown"`.
    - **Verification**: Tests de estabilidad: mismo config → mismo key; cambios relevantes → key distinto.

- [x] **Step 2.2**: Añadir util de “label” de variante para UI
    - **Details**: Crear helper que convierta `(gameId, variantKey)` en etiqueta humana: p.ej. `"501 · Double Out"`. Mantener fallback `"Variante"`.
    - **Verification**: Snapshot tests sencillos o assertions.

### Phase 3: Métricas por partida (PPD/MPR/puntos/marcas)

- [x] **Step 3.1**: Implementar cálculo de métricas por participante en `src/lib/rankings/match-metrics.ts`
    - **Details**: Dado `Match` + `throws[]` + `participants[]`, devolver `MatchResult` por participante: `dartsValid`, `pointsValid`, `roundsPlayed`, y `marks` (solo cricket: segments 15-20 y 25, marks=multiplier si valid). Usar `roundIndex` para rounds.
    - **Verification**: Tests con throws sintéticos cubriendo valid/invalid.

- [x] **Step 3.2**: Implementar regla X01 “bust anula turno” para PPD X01
    - **Details**: Para PPD en X01, agrupar por `(participantId, roundIndex)` y si existe cualquier `isBust=true` en esa ronda, contar puntos de esa ronda como 0 (pero mantener dardos válidos si se decide). Documentar decisión exacta.
    - **Verification**: Test: ronda con bust → puntos=0 en agregación.

- [x] **Step 3.3**: Definir PPD/MPR derivados desde stats persistidas
    - **Details**: Establecer fórmulas: `PPD = pointsValid / dartsValid` (no cricket); `MPR = marks / roundsPlayed` (cricket). Definir comportamiento cuando denominador=0.
    - **Verification**: Tests de edge cases (0 dardos / 0 rondas).

### Phase 4: ELO por modo/variante (y global “Todos”)

- [x] **Step 4.1**: Implementar ELO multi-jugador “winner-only” en `src/lib/rankings/elo.ts`
    - **Details**: Modelar match N jugadores como (ganador vs cada perdedor). Usar K dinámico: alto con pocas partidas (p.ej. 40) y bajo con muchas (p.ej. 16). Mantener rating entero. Para empates (sin winnerId), no actualizar.
    - **Verification**: Tests: ganador sube, perdedores bajan, suma de deltas ~0.

- [x] **Step 4.2**: Soportar equipos en ELO (si match tiene teams)
    - **Details**: Si `teamId` existe, rating de equipo=media de ratings de miembros. Ganador = team del `winnerId`. Aplicar deltas a miembros proporcionalmente (igual para todos) o por media.
    - **Verification**: Test de 2v2: ganadores suben igual.

- [x] **Step 4.3**: Definir “Todos” como rating global independiente
    - **Details**: Mantener `gameId="all"` y `variantKey="__all__"` para un rating global actualizado con cualquier match completed, en paralelo al rating específico del modo.
    - **Verification**: Test: finalizar match x01 actualiza también stats globales.

### Phase 5: Persistencia incremental al finalizar partidas

- [x] **Step 5.1**: Crear servicio `finalizeMatchForRankings` en `src/lib/rankings/recompute.ts`
    - **Details**: Función que, dado `matchId`, carga match + participants + throws, calcula `variantKey`, crea `MatchResult` si no existe y hace upsert/increment de `PlayerModeStats`. Debe ser idempotente usando unique keys.
    - **Verification**: Test: correr 2 veces no duplica stats.

- [x] **Step 5.2**: Integrar finalización en `src/app/actions/matches.ts`
    - **Details**: En `registerThrow` y `registerThrowForPlayer`, cuando `createdThrow.isWin` cambia match a `completed`, llamar a `finalizeMatchForRankings(matchId)` dentro de transacción o justo después con consistencia (reintentos y manejo de error).
    - **Verification**: Test de integración ligero (mock prisma) o unit test del servicio.

- [x] **Step 5.3**: Manejar correcciones (undo/undoAbort) con recompute seguro
    - **Details**: Si una partida deja de ser completed (por `undoLastThrow`) o vuelve a serlo (`undoAbortMatch`), marcar `MatchResult` como revocado o recalcular; y lanzar recompute del `(gameId, variantKey)` afectado. Priorizar corrección sobre incremental.
    - **Verification**: Test: undo de win elimina/ajusta stats tras recompute.

### Phase 6: Server Action de rankings + filtros

- [x] **Step 6.1**: Ampliar tipos en `src/types/actions/rankings.ts`
    - **Details**: Sustituir `score` genérico por campos explícitos: `ratingElo`, `pointsAggregated`, `marksAggregated?`, `isProvisional`, `variantKey`, `lastMatchAt?`. Mantener `ppd` y `mpr` como derivados. Añadir request type con `gameType` + `variantKey?` + `limit?`.
    - **Verification**: `tsc` sin errores de tipos en rankings.

- [x] **Step 6.2**: Reimplementar `getRankings` en `src/app/actions/rankings.ts`
    - **Details**: Consultar `PlayerModeStats` + `PlayerModeRating` para el scope (modo/variante). Orden por `ratingElo desc`, desempate por `matchesPlayed desc`. Calcular `ppd/mpr` en server desde agregados. Marcar `isProvisional = matchesPlayed < N`.
    - **Verification**: Test de action (unit) y respuesta consistente con filtros.

- [x] **Step 6.3**: Añadir action para listar variantes disponibles
    - **Details**: Crear `getRankingVariants(gameType)` que devuelva `variantKey + label + matchCount` desde `PlayerModeStats` o `MatchResult`. Usar para dropdown UI.
    - **Verification**: UI recibe opciones y renderiza.

### Phase 7: UI de Rankings (pro, divertida y usable)

- [x] **Step 7.1**: Actualizar `src/app/(admin)/rankings/page.tsx` con filtro por variante
    - **Details**: Añadir dropdown “Variante” visible en tabs de modo (`x01`, `cricket`) y oculto en `all`. Persistir `variant` en querystring. Mostrar etiqueta humana.
    - **Verification**: Cambiar variante actualiza tabla y mantiene `returnTo`.

- [x] **Step 7.2**: Mostrar ELO + “Puntos agregados” simultáneamente
    - **Details**: Cambiar columnas: `ELO` (principal), `Puntos` (o `Marcas` en cricket), `% victorias`, `Partidas`, `PPD/MPR`. Mantener layout responsive.
    - **Verification**: Tabla se ve bien en widths pequeñas (overflow-x).

- [x] **Step 7.3**: Añadir badge “Provisional” con tooltip
    - **Details**: Si `isProvisional`, mostrar chip “Provisional” junto al nombre y tooltip: `"Rating provisional: menos de N partidas"`. Opcional: style discreto.
    - **Verification**: Jugadores con pocas partidas muestran badge.

### Phase 8: Backfill / Recompute (operaciones y longevidad)

- [x] **Step 8.1**: Implementar recompute por modo/variante en `src/lib/rankings/recompute.ts`
    - **Details**: Función que recalcula stats+rating desde cero leyendo matches completed del scope, ordenados por `endedAt`. Reescribir tablas del scope de forma transaccional.
    - **Verification**: Test: recompute produce mismos resultados que incremental.

- [x] **Step 8.2**: Añadir script `scripts/recompute-rankings.mjs`
    - **Details**: CLI para ejecutar recompute (por gameId y opcional variantKey). Usar Prisma Client, logs mínimos y exit codes. Pensado para mantenimiento y migraciones.
    - **Verification**: Ejecuta en local y termina con éxito.

### Phase 9: Tests y calidad

- [x] **Step 9.1**: Añadir tests unitarios de ELO
    - **Details**: Casos: 2 jugadores, N jugadores winner-only, K dinámico, teams 2v2. Verificar monotonicidad y deltas esperados.
    - **Verification**: `pnpm test` pasa.

- [x] **Step 9.2**: Añadir tests de métricas X01/Cricket
    - **Details**: X01: bust anula puntos de ronda; Cricket: marks sólo en 15-20 y bull; roundsPlayed por roundIndex distinto. Valid/invalid.
    - **Verification**: `pnpm test` pasa.

- [x] **Step 9.3**: Añadir tests de `variantKey`
    - **Details**: Estabilidad y legibilidad. Fallback de JSON inválido.
    - **Verification**: `pnpm test` pasa.

## 4. Verification Plan

- [x] Ejecutar unit tests: `pnpm test`
- [x] Ejecutar lint: `pnpm lint`
- [ ] Verificar migraciones: `pnpm prisma migrate dev`
- [ ] Verificación manual:
    - [ ] Crear match X01 (501 DO), finalizar y ver ranking X01/variante.
    - [ ] Crear match Cricket, finalizar y ver MPR + marcas.
    - [ ] Probar “undoLastThrow” sobre un win y confirmar recompute corrige ranking.
    - [ ] Confirmar badge “Provisional” aparece con < N partidas.

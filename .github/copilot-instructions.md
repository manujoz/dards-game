---
description: General project instructions for Darts game
---

# Dards Game - Next.js Project

<project_overview>

## Project Purpose

Video juego de dardos para pantallas táctiles con diferentes modos de juego y multijugador por turnos.

## Technology Stack

- **Framework**: Next.js 16 (App Router) con React 19
- **Language**: TypeScript 5.6 (strict mode)
- **Database**: PostgreSQL con Prisma ORM
- **UI**: Tailwind CSS + shadcn/ui (Radix UI primitives)
- **Testing**: Vitest para lógica de juego
- **Validation**: Zod schemas
- **Deployment**: Netlify con PostgreSQL en Neon
- **Icons**: Lucide React
- **Audio**: HTML5 Audio API (canvas-confetti para efectos)

## Project Structure

- `/src/app`: Next.js App Router (pages, layouts, Server Actions)
- `/src/components`: React components organizados por dominio (admin, game, home, ui)
- `/src/lib`: Lógica de negocio pura (game engine, calibración, audio, DB client)
- `/src/types`: Type definitions organizadas por dominio
- `/prisma`: Schema y migrations para PostgreSQL
- `/tests`: Tests unitarios con Vitest (game engine, score mapper, calibración)
- `/docs`: Documentación del proyecto (architecture, rules, components, deployment)
- `/public/sounds`: Assets de audio para efectos de juego

## Game Modes Available

**x01**: 301/501/701 con variantes de checkout (double-out, master-out, straight-out)
**Cricket**: Score en números 15-20 y bullseye, marcar 3 veces para cerrar
**Shanghai**: Secuencia por rondas (ronda 1 → solo cuenta segmento 1, etc.)
**Round the Clock**: Golpear secuencialmente 1-20 más bullseye
**High Score**: Máxima puntuación en 3 dardos por ronda
**Halve It**: Targets por ronda, fallar divide score por 2
**Killer**: Modo eliminación con vidas asignadas por segmento

</project_overview>

<coding_standards>

## TypeScript Configuration

- **Target**: ES2017
- **Module**: ESNext (bundler resolution)
- **Strict Mode**: Enabled
- **JSX**: react-jsx
- **Path Aliases**: `@/*` → `./src/*`

## Type System Organization

- **Domain Types**: Organizados en `/src/types` por feature (models, actions, components)
- **Model Types**: Core domain types en `models/darts.ts` (GameState, PlayerState, Throw, Turn)
- **Action Types**: Return types para Server Actions en `actions/*.ts`
- **Component Props**: Component-specific types en `components/*.ts`
- **Type Exports**: Centralizar exports en `types/index.ts`

## ESLint Rules

- **Quotes**: Double quotes (strings y JSX)
- **Indentation**: 4 spaces (SwitchCase: 1)
- **Max Line Length**: 150 characters
- **No Console**: Error (allow warn/error)
- **React Hooks**: exhaustive-deps off (manejo manual)
- **Prettier Integration**: auto-format on save

## Naming Conventions

- **Components**: PascalCase (GameController, PlayerList)
- **Files**: kebab-case para utils, PascalCase para componentes
- **Functions**: camelCase (createAsset, getPortfolio)
- **Constants**: UPPER_SNAKE_CASE
- **Types/Interfaces**: PascalCase con prefijo `I` para interfaces opcionales

## Import Order

Mantener grupos separados con una línea en blanco entre cada categoría:

1. Type imports (types e interfaces)
2. React imports
3. Third-party libraries (ordenadas alfabéticamente dentro del grupo)
4. Alias imports (@/components, @/lib, etc.)
5. Relative imports (./components, ../utils, etc.)

</coding_standards>

<architecture>

## Core Architecture Patterns

### Game Engine (Pure Functions)
- **Location**: `/src/lib/game/game-engine.ts`
- **Pattern**: Immutable state transformations
- **State Flow**: GameState → Action → NewGameState
- **Testing**: Full coverage con Vitest

### Game Mode Implementations
- **Location**: `/src/lib/game/games/*.ts`
- **Interface**: Unified IGameMode interface
- **Modes**: x01, cricket, shanghai, round-the-clock, high-score, halve-it, killer
- **Pattern**: Strategy pattern con handlers específicos por modo

### Server Actions Pattern
- **Location**: `/src/app/actions/*.ts`
- **Directive**: Iniciar con `"use server"`
- **Return Type**: Consistent `{ success: boolean; data?: T; error?: string }`
- **Validation**: Zod schemas antes de DB operations
- **Revalidation**: Usar `revalidatePath()` después de mutaciones

### Component Organization
- **Admin Components**: CRUD operations, form dialogs, data tables
- **Game Components**: DartboardCanvas, GameController, scoreboards, overlays
- **UI Components**: shadcn/ui primitives (button, dialog, dropdown-menu, input)
- **Pattern**: Client components con `"use client"`, Server components por defecto

### Database Layer
- **ORM**: Prisma Client
- **Models**: Player, Match, MatchTeam, MatchParticipant, Throw, DeviceConfig
- **Patterns**: Cascade deletes, JSON fields para config/calibration
- **Client**: Singleton en `/src/lib/db/prisma.ts`

</architecture>


<workflow_guidelines>

## Development Workflow

1. Branch desde `master`
2. Commits con formato Commitlint
3. Tests locales con `pnpm test`
4. Lint con `pnpm lint`
5. Lint con `pnpm lint:fix` para arreglar issues automáticamente
6. Build verification con `pnpm build`
7. PR review antes de merge

</workflow_guidelines>

<git_commits>

## Commit Convention (Commitlint)

Format: `type(scope): prefix subject`

**Types:** `build`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`, `chore`

**Prefixes:** `add`, `fix`, `resolve`, `update`, `test`, `change`, `remove`, `panic`, `close`, `create`

**Examples:**
- `feat(game): add rules admin section`
- `fix(engine): resolve bust edge case in x01`
- `refactor(ui): update admin navigation layout`

</git_commits>

<critical_constraints>

## Server Actions & Next.js

- ❌ **NEVER**: Usar API routes (Next.js Pages Router pattern) - usar Server Actions
- ❌ **NEVER**: Hardcodear valores de configuración - usar variables de entorno
- ❌ **NEVER**: Crear Client Components sin `"use client"` directive
- ❌ **NEVER**: Olvidar `revalidatePath()` después de mutaciones
- ✅ **ALWAYS**: Iniciar Server Actions con `"use server"`
- ✅ **ALWAYS**: Usar `try-catch` en Server Actions con retorno consistente
- ✅ **ALWAYS**: Validar inputs con Zod antes de operaciones DB

## TypeScript & Code Quality

- ❌ **NEVER**: Usar *any* en TypeScript - siempre tipar correctamente
- ❌ **NEVER**: Hacer console.log en producción - permitido solo warn/error
- ✅ **ALWAYS**: Tipar correctamente en TypeScript sin usar any, siempre definir tipos e interfaces siguiendo las instrucciones
- ✅ **ALWAYS**: Seguir convenciones de commit para historial claro

## Game Engine & Testing

- ✅ **ALWAYS**: Mantener la lógica del motor de juego pura y testeada (Vitest)
- ✅ **ALWAYS**: Escribir tests para lógica crítica (motor de juego, score-mapper, calibración)
- ✅ **ALWAYS**: Incluir healthchecks cuando haya configuración de despliegue/infra

</critical_constraints>

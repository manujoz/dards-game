---
description: General project instructions for Darts game
---

# Dards Game - Next.js Project

<project_overview>

## Project Purpose

Video juego de dardos para pantallas táctiles con diferentes modos de juego y multijugador por turnos.

<coding_standards>

## TypeScript Configuration

- **Target**: ES2017
- **Module**: ESNext (bundler resolution)
- **Strict Mode**: Enabled
- **JSX**: react-jsx
- **Path Aliases**: `@/*` → `./src/*`

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

5. Type imports (último)
1. React imports
2. Third-party libraries
3. Alias imports (@/components, @/lib, etc.)
4. Relative imports

</coding_standards>


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


- ❌ **NEVER**: Usar API routes (Next.js Pages Router pattern) - usar Server Actions
- ❌ **NEVER**: Hardcodear valores de configuración - usar variables de entorno
- ❌ **NEVER**: Crear Client Components sin `"use client"` directive
- ❌ **NEVER**: Olvidar `revalidatePath()` después de mutaciones
- ❌ **NEVER**: Usar *any* en TypeScript - siempre tipar correctamente
- ❌ **NEVER**: Hacer console.log en producción - permitido solo warn/error



- ✅ **ALWAYS**: Iniciar Server Actions con `"use server"`
- ✅ **ALWAYS**: Mantener la lógica del motor de juego pura y testeada (Vitest)
- ✅ **ALWAYS**: Usar `try-catch` en Server Actions con retorno consistente
- ✅ **ALWAYS**: Validar inputs con Zod antes de operaciones DB
- ✅ **ALWAYS**: Incluir healthchecks cuando haya configuración de despliegue/infra
- ✅ **ALWAYS**: Escribir tests para lógica crítica (motor de juego, score-mapper, calibración)
- ✅ **ALWAYS**: Seguir convenciones de commit para historial claro
- ✅ **ALWAYS**: Tipar correctamente en TypeScript sin usar any, siempre definir tipos e interfaces siguiendo las instrucciones

</critical_constraints>

---
description: General project instructions for Darts game
---

# Investments - Next.js Project

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

- **Components**: PascalCase (AssetManager, Dashboard)
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

Format: `type(INV-###): prefix subject`

**Types:** `build`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`, `chore`

**Prefixes:** `add`, `fix`, `resolve`, `update`, `test`, `change`, `remove`, `panic`, `close`, `create`

**Examples:**
- `feat(INV-123): add new gallery component`
- `fix(INV-456): update API error handling`
- `refactor(INV-789): change drivers data structure`

**Note**: Issue ID `(INV-###)` is mandatory for all commits

</git_commits>

<critical_constraints>


- ❌ **NEVER**: Usar API routes (Next.js Pages Router pattern) - usar Server Actions
- ❌ **NEVER**: Almacenar decimales como Number/Float en MongoDB - usar String
- ❌ **NEVER**: Crear Client Components sin `"use client"` directive
- ❌ **NEVER**: Olvidar `revalidatePath()` después de mutaciones
- ❌ **NEVER**: Ejecutar operaciones MongoDB sin Replica Set para transacciones
- ❌ **NEVER**: Hardcodear valores de configuración - usar variables de entorno
- ❌ **NEVER**: Hacer console.log en producción - permitido solo warn/error
- ❌ **NEVER**: Usar *any* en TypeScript - siempre tipar correctamente


- ✅ **ALWAYS**: Iniciar Server Actions con `"use server"`
- ✅ **ALWAYS**: Convertir String → Decimal para cálculos precisos
- ✅ **ALWAYS**: Usar `try-catch` en Server Actions con retorno consistente
- ✅ **ALWAYS**: Validar inputs con Zod antes de operaciones DB
- ✅ **ALWAYS**: Incluir healthchecks cuando haya configuración de despliegue/infra
- ✅ **ALWAYS**: Escribir tests para lógica de negocio crítica (Tax Lots, strategies)
- ✅ **ALWAYS**: Seguir convenciones de commit para historial claro
- ✅ **ALWAYS**: Tipar correctamente en TypeScript sin usar any, siempre definir tipos e interfaces siguiendo las instrucciones

</critical_constraints>

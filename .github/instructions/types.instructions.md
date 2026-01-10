---
description: Guidelines for organizing TypeScript types by domain and feature
applyTo: 'src/types/**/*.ts, src/components/**/*.tsx, src/components/**/*.jsx'
---

# TypeScript Types Organization

<workflow>
1. Identify type's domain (actions, models, strategies, components, shared)
2. Create feature file in `src/types/[domain]/[feature].ts`
3. Export from domain `index.ts` → root `src/types/index.ts`
4. Import using `@/types/[domain]` or `@/types`
</workflow>

<structure>

## Directory Organization

```
src/types/
├── index.ts                 # Re-exports all domains
├── actions/                 # Server Action states (AuthState, RegisterState)
├── models/                  # Prisma extensions (LotWithRemaining, AssetWithTransactions)
├── strategies/              # Business logic (Strategy, SaleAllocation)
├── components/              # Component props (AssetManagerProps, DashboardProps)
└── shared/                  # Cross-domain (ApiResponse, FormState, ValidationError)
```

Each domain folder contains:
- Feature-specific files: `auth.ts`, `dashboard.ts`, `assets.ts`
- `index.ts` for re-exports

</structure>

<naming>

## Conventions

| Type Purpose | Pattern | Example |
|--------------|---------|---------|
| **Component Props** | `[Component]Props` | `AssetManagerProps` |
| **Action State** | `[Action]State` | `AuthState`, `RegisterState` |
| **Prisma Extension** | `[Model]With[Relation]` | `AssetWithTransactions` |
| **Enum/Union** | PascalCase | `Strategy`, `TransactionType` |

**Type vs Interface**:
- `interface` for objects (props, data structures)
- `type` for unions, intersections, Prisma extensions with `&`

</naming>

<domains>

## Domain Rules

| Domain | Content | Example |
|--------|---------|---------|
| **actions/** | Server Action return types | `AuthState`, `DashboardActionState` |
| **models/** | Prisma model extensions | `LotWithRemaining = TaxLot & { remaining: Decimal }` |
| **strategies/** | Business logic types | `Strategy = "FIFO" \| "LIFO"`, `SaleAllocation` |
| **components/** | Component props | `AssetManagerProps`, `MetricCardProps` |
| **shared/** | Generic utilities | `ApiResponse<T>`, `PaginationParams` |

</domains>

<imports>

## Re-Export Pattern

```typescript
// Domain index: src/types/actions/index.ts
export * from "./auth";
export * from "./dashboard";

// Root index: src/types/index.ts
export * from "./actions";
export * from "./models";
export * from "./strategies";
export * from "./components";
export * from "./shared";

// Usage
import type { AuthState } from "@/types";                    // ✅ Root
import type { AssetManagerProps } from "@/types/components"; // ✅ Domain
```

</imports>

<migration>

## Migration Pattern

```typescript
// Before: Types in action file
// src/app/actions/dashboard.ts
export interface DashboardData { ... }

// After: Move to types
// src/types/actions/dashboard.ts
export interface DashboardData { ... }

// src/app/actions/dashboard.ts
import type { DashboardData } from "@/types/actions/dashboard";
```

**Steps**: Create file → Move types → Update `index.ts` → Update imports

</migration>

<constraints>

- ❌ **NEVER** define types inline in Server Actions/components
- ❌ **NEVER** import without `@/types` alias
- ❌ **NEVER** skip `index.ts` re-exports
- ❌ **NEVER** mix domains in single file
- ✅ **ALWAYS** categorize by domain folder
- ✅ **ALWAYS** suffix action states with `State`
- ✅ **ALWAYS** prefix component props with component name
- ✅ **ALWAYS** use `type` for unions, `interface` for objects

</constraints>
---
description: Guidelines for creating React components in Next.js App Router
applyTo: 'src/components/**/*.tsx, src/components/**/*.jsx'
---

# React Component Standards

<workflow>
1. Define props interface in `src/types/components/[feature].ts`
2. Create component file in PascalCase (`AssetManager.tsx`)
3. Structure imports: Types → External Libraries → App Components → Hooks/Actions/Utils
4. Add `"use client"` only if interactive (hooks, events, browser APIs)
5. Define handlers before return, destructure props
6. Export as named export (no default)
</workflow>

<organization>

## Component Directory Structure

**Never place components directly in `src/components/`**. Organize by feature or domain:

```
src/components/
├── ui/                    # Reusable UI primitives (button, card, input)
├── auth/                  # Authentication (login-form, register-form, logout-button)
├── assets/                # Asset management (AssetManager, AssetForm, AssetCard)
├── transactions/          # Transaction features (TransactionManager, TransactionList)
├── dashboard/             # Dashboard widgets (MetricCard, PortfolioChart)
└── shared/                # Cross-feature components (Header, Footer, Navigation)
```

**Categorization rules:**
- **ui/**: Generic components from shadcn/ui or custom base components
- **[feature]/**: Feature-specific components (assets, transactions, wallets)
- **shared/**: Layout components used across multiple features
- **[domain]/**: Business domain grouping when features are related

**File naming within folders:**
- Single component: `AssetManager.tsx` (no index.ts)
- Multiple related: `AssetForm.tsx`, `AssetCard.tsx`, `AssetList.tsx`
- Index exports only for re-exporting multiple components

</organization>

<imports>

## Import Order (single blank line between groups)

1. Type imports from `@/types`
2. External libraries (react, next, third-party)
3. App components (`@/components`)
4. Hooks, Actions, Utils (`@/stores`, `@/app/actions`, `@/lib`)

</imports>

<naming>

| Element | Pattern | Example |
|---------|---------|---------|
| **File/Component** | PascalCase | `AssetManager.tsx`, `export function AssetManager()` |
| **Props Interface** | `[Component]Props` | `AssetManagerProps` (in `src/types/components/`) |
| **Handlers** | `handle[Action]` | `handleSubmit`, `handleEdit`, `handleToggle` |
| **State** | camelCase | `isOpen`, `selectedAsset` |
| **Custom Hooks** | `use[Feature]` | `useAssetData`, `useAuth` |

**Props must be:**
- Defined in `src/types/components/[feature].ts`
- Destructured in component signature
- Never inline or anonymous types

</naming>

<client_directive>

## "use client" Usage

**Add directive when component needs:**
- React hooks (useState, useEffect, useContext, etc.)
- Event handlers (onClick, onChange, onSubmit)
- Browser APIs (window, localStorage, navigator)
- Client-only libraries

**Default to Server Component for:**
- Static rendering, data fetching, SEO content

</client_directive>

<structure>

## Component Structure Order

```typescript
export function Component({ prop1, prop2 }: ComponentProps) {
    // 1. State hooks (useState)
    // 2. Ref hooks (useRef)
    // 3. Context/Router hooks (useRouter, usePathname)
    // 4. Custom hooks (useAuth, useAssetData)
    // 5. Memoized values (useMemo)
    // 6. Callbacks (useCallback)
    // 7. Effects (useEffect)
    // 8. Event handlers (handleSubmit, handleEdit)
    // 9. Return JSX
}
```

**Handler patterns:**
- Async: `async function handleSubmit(formData: FormData) { ... }`
- Sync: `function handleToggle() { setIsOpen(prev => !prev); }`
- With params: `function handleEdit(id: string) { ... }`

</structure>

<constraints>

- ❌ **NEVER** use `export default` in components
- ❌ **NEVER** define props inline or types in component files
- ❌ **NEVER** add `"use client"` without interactivity need
- ❌ **NEVER** place handlers after return
- ❌ **NEVER** mix import groups without blank lines
- ❌ **NEVER** write obvious comments (only for complex logic)
- ❌ **NEVER** place components directly in `src/components/` root
- ✅ **ALWAYS** define interfaces in `src/types/components/`
- ✅ **ALWAYS** destructure props in signature
- ✅ **ALWAYS** use PascalCase for files/components
- ✅ **ALWAYS** follow hook order and import grouping
- ✅ **ALWAYS** use named exports
- ✅ **ALWAYS** organize components in feature/domain folders

</constraints>


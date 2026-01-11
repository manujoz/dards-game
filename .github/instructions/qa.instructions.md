---
description: Comprehensive QA validation guidelines for code review and testing
applyTo: '**/*.ts, **/*.tsx, **/*.js, **/*.jsx'
---

# QA Validation Standards

<workflow>

## Validation Protocol

1. **Requirements Analysis**: Verify implementation matches specifications, user stories, or issue descriptions
2. **Code Review**: Assess code quality, patterns, standards compliance, TypeScript typing
3. **Functional Testing**: Validate business logic, edge cases, error handling, state management
4. **Integration Testing**: Verify component interactions, data flow, Server Actions, database operations
5. **UI/UX Validation**: Test user flows, accessibility, internationalization, responsive design
6. **Performance Assessment**: Check bundle size, render performance, query optimization, caching
7. **Security Review**: Validate authentication, authorization, input sanitization, environment variables
8. **Documentation Verification**: Ensure code comments, JSDoc, README updates, changelog entries
9. **Regression Testing**: Confirm no existing functionality broken, run test suite, check related features
10. **Deployment Readiness**: Verify build success, environment variables, and database migrations

</workflow>

<code_review_checklist>

## Code Quality Standards

### TypeScript & Type Safety
- ✅ No `any` types (use proper interfaces/types from `src/types/`)
- ✅ All props interfaces defined in `src/types/components/[feature].ts`
- ✅ Return types explicitly declared for functions
- ✅ Enums used for fixed value sets (not magic strings)
- ✅ Null/undefined handled with optional chaining or type guards
- ✅ Generic types used appropriately for reusable components

### Component Architecture
- ✅ Server Components by default (Client Components only when needed)
- ✅ `"use client"` directive present when required (hooks, events, browser APIs)
- ✅ Props destructured in component signature
- ✅ Handlers defined before JSX return
- ✅ Named exports (no default exports)
- ✅ Component organized in correct feature directory

### Server Actions
- ✅ `"use server"` directive at file start
- ✅ Input validation with Zod schemas
- ✅ Try-catch blocks with consistent error return structure
- ✅ `revalidatePath("/")` after mutations
- ✅ Decimal operations use `Decimal.js` (never Number for financial data)
- ✅ MongoDB strings converted to Decimal for calculations

### Data Handling
- ✅ Database queries use Prisma with proper error handling
- ✅ Transactions used for atomic operations (Replica Set required)
- ✅ Financial amounts stored as `String` in MongoDB
- ✅ Decimal conversions: `toDecimal()` and `fromDecimal()` helpers
- ✅ FIFO logic correctly implements TaxLot consumption
- ✅ Date handling uses `DateTime` consistently

### Internationalization (i18n)
- ✅ No hardcoded text (use `getTranslations()` or `useTranslations()`)
- ✅ Translation keys exist in `messages/en.json` and `messages/es.json`
- ✅ Navigation uses `@/i18n/routing` (not `next/link` or `next/navigation`)
- ✅ Locale parameter handled in routes when applicable
- ✅ Date/number formatting locale-aware

### Performance & Optimization
- ✅ Unnecessary re-renders avoided (memoization when needed)
- ✅ Server Components preferred for static content
- ✅ Images use Next.js `<Image>` with proper optimization
- ✅ Large lists paginated or virtualized
- ✅ Database queries optimized (select only needed fields)
- ✅ TanStack Query used for data fetching/caching

### Security
- ✅ User authentication verified (NextAuth session checks)
- ✅ Authorization implemented (user can only access own data)
- ✅ Input sanitization prevents XSS/SQL injection
- ✅ Sensitive data not exposed in client components
- ✅ Environment variables properly configured
- ✅ No console.log statements (only warn/error allowed)

### Code Style & Standards
- ✅ ESLint rules followed (double quotes, 4-space indentation, 150 char line length)
- ✅ Imports ordered: Types → External → Alias (@/) → Relative
- ✅ Naming conventions: PascalCase (components), camelCase (functions), UPPER_SNAKE_CASE (constants)
- ✅ File naming: kebab-case for utils, PascalCase for components
- ✅ Git commits follow Commitlint format (`type: prefix subject`)

</code_review_checklist>

<functional_testing>

## Testing Scenarios

### Critical Business Logic
- **FIFO Tax Lots**: Verify BUY creates TaxLot, SELL consumes oldest lots, `remainingQuantity` updates correctly
- **Profit Calculations**: Validate `realizedProfit` formula: `(sellPrice - lotAvgPrice) * quantityUsed`
- **Portfolio Metrics**: Confirm total value, PnL, ROI calculations use Decimal.js
- **Asset Management**: Test create/update/delete with validation, duplicate prevention

### Edge Cases
- **Zero/Negative Amounts**: Reject invalid transaction amounts
- **Insufficient Quantity**: Prevent SELL when quantity > available
- **Empty Tax Lots**: Handle SELL when no TaxLots exist for asset
- **Concurrent Transactions**: Verify MongoDB transaction isolation
- **Decimal Precision**: Test with small amounts (0.00000001 crypto)

### User Flows
- **Authentication**: Login/logout, session persistence, protected routes
- **Asset Lifecycle**: Create asset → Add transactions → View portfolio → Edit → Delete
- **Multi-Currency**: Assets in different currencies display correct conversions
- **Wallet Management**: Create wallets, assign assets, filter by wallet
- **Language Switch**: UI updates correctly when locale changes

### Error Handling
- **Network Failures**: Graceful degradation when Yahoo Finance API fails
- **Database Errors**: User-friendly messages, no stack traces exposed
- **Validation Errors**: Clear field-level error messages in forms
- **Unauthorized Access**: Redirect to login, preserve intended destination

</functional_testing>

<integration_testing>

## Integration Points

### Server Action → Prisma → MongoDB
- Verify data persists correctly in MongoDB
- Confirm replica set transactions work atomically
- Check indexes used for query performance
- Validate cascade deletes (e.g., deleting asset removes transactions)

### Client Component → Server Action
- TanStack Query mutations trigger revalidation
- Optimistic updates work correctly
- Error states handled gracefully
- Loading states shown during async operations

### Yahoo Finance Integration
- Price fetching works for various asset types (crypto, stocks)
- Cache strategy prevents API rate limits
- Fallback to cached data when API unavailable
- Composite pattern aggregates multiple providers

### NextAuth Flow
- Credentials provider authenticates correctly
- Session persists across page refreshes
- Middleware protects dashboard routes
- Logout clears session properly

</integration_testing>

<ui_ux_validation>

## User Interface Quality

### Accessibility (a11y)
- Semantic HTML elements used (`<main>`, `<nav>`, `<button>`)
- ARIA labels present for icon-only buttons
- Keyboard navigation works (Tab, Enter, Escape)
- Focus indicators visible
- Color contrast meets WCAG AA standards (4.5:1 for text)

### Responsive Design
- Mobile-first approach (Tailwind breakpoints: sm, md, lg, xl)
- Touch targets ≥44px for mobile
- Tables use horizontal scroll or card layout on mobile
- Forms stack vertically on small screens
- Navigation adapts (hamburger menu on mobile)

### Internationalization UX
- Date formats locale-aware (DD/MM/YYYY vs MM/DD/YYYY)
- Currency symbols correct for locale (€ vs $)
- Number formatting respects locale (1,000.00 vs 1.000,00)
- Text direction handled (future RTL support)

### User Feedback
- Success messages for mutations (toast notifications)
- Loading spinners during async operations
- Disabled states for buttons during processing
- Confirmation dialogs for destructive actions (delete)
- Form validation errors clear and actionable

</ui_ux_validation>

<performance_metrics>

## Performance Targets

- **First Contentful Paint (FCP)**: <1.8s
- **Largest Contentful Paint (LCP)**: <2.5s
- **Time to Interactive (TTI)**: <3.5s
- **Cumulative Layout Shift (CLS)**: <0.1
- **Bundle Size**: Monitor Next.js build output, flag significant increases
- **Database Queries**: <100ms for simple queries, <500ms for complex aggregations
- **API Response Time**: <200ms for Server Actions

### Performance Testing Tools
- Lighthouse CI for Core Web Vitals
- Next.js build analyzer for bundle size
- MongoDB profiler for slow queries
- Browser DevTools Performance tab

</performance_metrics>

<security_validation>

## Security Checklist

- **Authentication**: Verify session-based auth with NextAuth
- **Authorization**: Users access only their own data (userId filter in queries)
- **Input Validation**: Zod schemas validate all user inputs
- **XSS Prevention**: React escapes by default, no `dangerouslySetInnerHTML`
- **CSRF Protection**: NextAuth includes CSRF tokens
- **Environment Variables**: No secrets hardcoded, `.env` in `.gitignore`
- **Dependencies**: Run `pnpm audit` for vulnerabilities
- **HTTPS**: Production uses HTTPS (Nginx Proxy Manager)
- **Rate Limiting**: Consider implementing for login/register endpoints

</security_validation>

<documentation_requirements>

## Documentation Standards

### Code-Level Documentation
- Complex algorithms have JSDoc comments with examples
- Type definitions self-documenting with clear names
- Magic numbers replaced with named constants
- Regex patterns include explanation comments

### Architecture Documentation
- Update `docs/architecture.md` for schema changes
- Document new patterns in relevant `.instructions.md` files
- Add deployment notes to `docs/deployment.md` if infrastructure changes
- Update API documentation for new Server Actions

### Changelog & Commits
- Follow Commitlint format: `type: prefix subject`
- Group related changes in single commit when logical
- Reference issue numbers in commit messages (`feat: add portfolio widget (#123)`)
- Update CHANGELOG.md for user-facing changes

</documentation_requirements>

<regression_testing>

## Regression Prevention

### Automated Testing
- Run existing test suite: `pnpm test`
- Verify tests pass before deployment
- Add tests for new features/bug fixes
- Maintain >80% code coverage for critical paths

### Manual Verification
- Test related features (e.g., if modifying transactions, test portfolio calculations)
- Verify existing workflows still function (login → dashboard → create asset)
- Check side effects (e.g., deleting asset should remove transactions)
- Test in both locales (en, es)

### Database Integrity
- Verify migrations run cleanly
- Check foreign key constraints maintained
- Confirm seed data still loads correctly
- Test rollback scenarios

</regression_testing>

<deployment_validation>

## Pre-Deployment Checks

### Build Verification
- ✅ `pnpm build` succeeds without errors
- ✅ No TypeScript compilation errors
- ✅ No ESLint errors (warnings acceptable)
- ✅ Standalone build output configured correctly

### Configuración de despliegue
- ✅ Entorno de despliegue documentado
- ✅ Health checks definidos cuando aplique
- ✅ Environment variables documentadas en `.env.example`

### Database Readiness
- ✅ Prisma migrations applied: `pnpm prisma migrate deploy`
- ✅ MongoDB replica set configured (required for transactions)
- ✅ Indexes created for performance-critical queries
- ✅ Seed data populated if needed

### Monitoring & Rollback
- ✅ Blue-Green deployment strategy documented
- ✅ Rollback plan tested
- ✅ Logs accesibles (plataforma de hosting o servicio de monitoring)
- ✅ Health endpoints responding

</deployment_validation>

<critical_constraints>

## QA Non-Negotiables

- **NEVER** write, modify, or create code files (validation role only, not development)
- **NEVER** fix bugs directly (report issues with clear reproduction steps for developers)
- **NEVER** implement features or improvements (provide recommendations in reports)
- **NEVER** approve code using `any` in TypeScript
- **NEVER** allow hardcoded strings (must use i18n translations)
- **NEVER** permit Number/Float for financial amounts (String + Decimal.js only)
- **NEVER** skip validation for FIFO Tax Lot logic
- **NEVER** approve code without `revalidatePath()` after mutations
- **NEVER** allow console.log in production code
- **ALWAYS** verify Server Actions have `"use server"` directive
- **ALWAYS** confirm Client Components have `"use client"` when needed
- **ALWAYS** validate both locales work correctly
- **ALWAYS** test edge cases (zero amounts, concurrent operations, empty states)
- **ALWAYS** run full test suite before approval
- **ALWAYS** verify `pnpm build` succeeds

</critical_constraints>

<testing_tools>

## Available Testing Tools

- **Vitest**: Unit/integration tests (`pnpm test`)
- **Browser DevTools**: Manual testing, network inspection, React DevTools
- **Playwright**: E2E testing (via MCP tools if available)
- **Lighthouse**: Performance/accessibility audits
- **MongoDB Compass**: Database inspection, query profiling
- **curl/Postman**: API endpoint testing (if needed)

</testing_tools>

<validation_report_template>

## QA Sign-Off Report

After validation, provide structured report:

### ✅ Approved Areas
- [x] Code quality and standards compliance
- [x] Functional testing passed
- [x] UI/UX validation complete
- [x] Performance within targets
- [x] Security review clean

### ⚠️ Warnings (non-blocking)
- Minor performance improvement opportunity: [describe]
- Code style nitpick: [describe]

### ❌ Issues (blocking deployment)
- Critical bug: [describe with reproduction steps]
- Security vulnerability: [describe]
- Missing tests: [list coverage gaps]

### 📝 Recommendations
- Consider refactoring [component/function] for maintainability
- Add integration test for [scenario]
- Document [pattern/decision] in architecture docs

### 🎯 Final Verdict
**APPROVED** / **APPROVED WITH WARNINGS** / **REJECTED**

</validation_report_template>

---
agent: Developer Agent
description: Execute implementation plan with phase-by-phase validation, risk assessment, and quality checks
---

#file:../instructions/implementation-planning.instructions.md
#file:../copilot-instructions.md

# Execute Implementation Plan

Execute implementation plans with precision, safety, and quality. Analyze risks → Execute phases → Validate continuously.

## Workflow

### Phase 1: Pre-Implementation Analysis (MANDATORY)

1. **Load Plan**: Read `ai/{issue-type}/{task-id}-plan.md` - parse frontmatter, phases, steps, verification
2. **Analyze Codebase**: Verify files exist, read `src/types/**/*.ts`, check `prisma/schema.prisma`, locate tests
3. **Identify Risks**:
   - Code conflicts (outdated references, changed signatures)
   - Business violations (missing directives, hardcoded config, falta de `revalidatePath()`)
   - Integration issues (breaking changes, missing migrations, no `revalidatePath()`)
   - Type safety (`any`, missing interfaces)
   - Test gaps

4. **Report**:
   - **If risks**: `⚠️ BLOCKED - {N} risks | Risk #: {category} - {severity} | Issue/Plan/Reality/Location/Impact/Rec` → STOP
   - **If clean**: `✅ Analysis Complete | Plan/Phases/Files/Tests | No conflicts | Ready` → PAUSE for approval

### Phase 2: Sequential Execution

**For each phase:**

1. **Delegate**: Delegate to subagent `Developer` `: Execute Phase {N}` with:
   - Plan file, phase name, steps, files, verification criteria

2. **Subagent Work**: Implement steps (use `edit`/`multi_replace`), apply best practices (TS strict, Server Components, `"use server"`, Zod, `revalidatePath()`), run verifications, return `✅ Phase {N} Complete | Changes: [{files}] | Verification: {results} | Notes: {any}`

3. **Validate**: Review vs plan, run `pnpm test {file}`, `pnpm build`, `pnpm lint`, check Zod/Server Actions/tests

4. **Report**: `✅ Phase {N}: {name} | Summary: {1-2 lines} | Changes: [{files}#L] | Verification: ✅ TS/Tests/Lint/Manual | Next: Phase {N+1}` → WAIT (continue/review/modify/test/pause)

5. **Iterate**: Repeat for all phases

### Phase 3: Post-Implementation

1. **Final Validation**: Run `pnpm test`, `pnpm build`, `pnpm lint`
2. **Docs**: Update `docs/architecture.md` if schema changed, check Commitlint, resolve TODOs
3. **Verify Plan**: Cross-check verification section, manual checks, acceptance criteria
4. **Report**: `🎉 Complete | Plan/Phases/Files/Lines | Quality: ✅ Tests/Build/TS/Lint | Highlights: {3} | Recommendations: {3} | Handoff: QA/Manual/PR`

## Error Handling

**Risk Analysis**: `❓ Clarification: {questions}` → WAIT

**Phase Execution**: `🚨 Phase {N} Error | Error/Context/Cause/Files/Rec` → PAUSE (manual/auto/rollback/abort)

**Test Failures**: `⚠️ Tests Failed | {count}/{total} failed | {names}: {reasons} | Analysis/Cause/Impact | Options: fix tests/fix impl/skip` → WAIT

## Best Practices

**Communication**: Concise, use links with line numbers, visual indicators (✅⚠️🚨❓🔄), structured output, pause at boundaries

**Code Quality**: TS strict (no `any`), Server Components default, Server Actions (`"use server"`, Zod, `revalidatePath()`), test coverage

**Risk Mitigation**: Read before write, verify types exist, test incrementally, respect constraints, document changes

## Success Criteria

✅ All phases complete, verification met, tests pass, build OK, no TS/ESLint errors, manual checks done, docs updated, user approved

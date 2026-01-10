---
description: Guidelines for creating detailed, executable implementation plans for AI agents
applyTo: "ai/**/*.md"
---

# Implementation Planning Guidelines

<workflow>

1.  **Context Analysis**
    *   Analyze the user request.
    *   Scan the codebase to understand existing architecture, patterns, and technologies.
    *   Identify necessary file changes (creations, modifications, deletions).

2.  **Plan Structure Definition**
    *   Define the file path for the plan: `ai/[issue-type]/[jira-task-id]-plan.md` if not jira task use descriptive name.
    *   Initialize the plan with standard Frontmatter.

3.  **Detailed Step Generation**
    *   Break down the implementation into atomic tasks.
    *   Ensure each task is actionable and verifiable.

4.  **Review & Finalize**
    *   Verify all file paths are correct relative to root.
    *   Ensure no step is ambiguous.
    *   Save the plan file.

</workflow>

<structure>

## Plan File Format

The plan **MUST** follow this Markdown structure:

```markdown
---
id: {feature-kebab-case}
date: YYYY-MM-DD
status: proposed
authors: [Implementation Planner]
---

# Implementation Plan - {Feature Name}

## 1. Context & Analysis
- **Goal**: {Brief description of what will be achieved}
- **Tech Stack**: {List of relevant technologies/libraries}
- **Architecture**: {Brief note on architectural impact or patterns used}

## 2. Proposed Changes
### File Structure
```tree
src/
  components/
    NewComponent.tsx  (new)
    ExistingComponent.tsx (modify)
```

## 3. Implementation Steps

### Phase 1: {Phase Name}

- [ ] **Step 1.1**: {Action Verb} {File Path}
    - **Details**: {Specific instructions on what to change/add. Max 80 words.}
    - **Verification**: {How to verify this step is done.}

- [ ] **Step 1.2**: ...

### Phase 2: ...

## 4. Verification Plan
- [ ] Run specific tests: `npm test ...`
- [ ] Manual verification steps...

</structure>

<constraints>

- **Atomic Steps**: Each checkbox must represent a single logical unit of work (e.g., "Create interface", "Update API handler", not "Build the feature").
- **Word Limit**: Task details **MUST NOT** exceed 80 words. Be concise and technical.
- **File Paths**: ALWAYS use full relative paths from the workspace root (e.g., `src/components/Button.tsx`).
- **Existing Code**: If modifying, explicitly mention *what* to modify (e.g., "Add `onClick` prop to interface").
- **New Projects**: If the project is empty, define the initial structure and setup steps (init package.json, config files).
- **Tools**: Assume the executor has standard dev tools (git, node, etc.) and the project's defined scripts.

</constraints>

<examples>

### Good Task Example
- [ ] **Step 2.1**: Update `src/types/user.ts`
    - **Details**: Add `preferences` field to `User` interface. It should be an optional object containing `theme` (string) and `notifications` (boolean).
    - **Verification**: Check `src/types/user.ts` compiles.

### Bad Task Example
- [ ] **Step 2.1**: Fix the user model
    - **Details**: Go into the user file and make sure we can save preferences because the client needs it for the new dark mode feature that we are building next week. Also fix the typo in the comment while you are there. (Too long, vague, multiple responsibilities)

</examples>

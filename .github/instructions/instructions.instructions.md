---
name: SR Instructions
description: Comprehensive guidelines for creating and optimizing instruction files, agents, and prompts across various technology stacks
applyTo: "**/copilot-instructions.md, **/*.instructions.md, **/*.agent.md, **/*.prompt.md"
---

# Instruction File Creation & Optimization Guide

<principles>

## Core Optimization Principles

1. **Context Efficiency**: Aim for 30%+ reduction in token usage through consolidation and high information density, never more of 3 pages for instruction files
2. **XML Structure**: Use XML tags (`<workflow>`, `<constraints>`, `<patterns>`, `<structure>`, etc...) for improved AI parsing
3. **Role Definition**: Always define clear roles to boost accuracy by up to 30% (discovered through Anthropic research)
4. **Progressive Workflows**: Define sequential numbered steps to prevent overwhelming output
5. **Information Density**: Consolidate similar patterns, eliminate redundant examples, maintain completeness
6. **Self-Demonstration**: Instruction files must embody the principles they teach

## Context Engineering Best Practices

- **Info-First, Queries-Last**: Place contextual information before questions/tasks (30% better performance)
- **Consolidation**: Merge similar examples into unified code blocks (reduced 10 naming examples → 4)
- **Eliminate Redundancy**: Remove obvious comments and duplicate patterns
- **Concise Code Blocks**: Show only essential code without verbose explanations
- **Sequential Steps**: Number steps explicitly (1, 2, 3...) for clear execution order

</principles>

<structure>

## File Structure Standards

### For Instruction Files (`.instructions.md`)

```yaml
---
applyTo: "glob/pattern/**/*.ext"  # Precise targeting if applicable
description: Brief description shown in prompt UI (1-2 sentences)
---

# If needed link to related instructions
<required_instructions>
[related instructions](./related-file.instructions.md)
</required_instructions>

<workflow>
1. First step with clear action
2. Second step building on first
3. Sequential progression to goal
</workflow>

<constraints>
- ❌ NEVER do X (explicit prohibitions)
- ✅ ALWAYS do Y (mandatory actions)
</constraints>

<patterns>
Concise code examples demonstrating key patterns
</patterns>

[Other sections as needed with XML tags...]
```

### For Prompt Files (`.prompt.md`)

```yaml
---
agent: "SR General"  # Agent name if applicable
model: "Claude Sonnet 4.5"  # Preferred model if applicable
tools: ['edit', 'search', 'fetch', 'think']  # Available tools if applicable
description: Brief description shown in prompt UI (1-2 sentences)
---

# If needed link to related instructions
<required_instructions>
[related instructions](./related-file.instructions.md)
</required_instructions>

<workflow>
1. First step with clear action
2. Second step building on first
3. Sequential progression to goal
</workflow>

<constraints>
- ❌ NEVER do X (explicit prohibitions)
- ✅ ALWAYS do Y (mandatory actions)
</constraints>

<patterns>
Concise code examples demonstrating key patterns
</patterns>

[Other sections as needed with XML tags...]
```

### For Agents Files (`.agent.md`)

```yaml
---
description: Brief description shown in chat UI (1-2 sentences)
tools: ['edit', 'search', 'fetch', 'think']  # Available tools
model: Claude Sonnet 4.5  # Preferred model
---

# Mode Name

<role>
Role definition and core responsibilities.
</role>

## Operating Principles

<operating_principles>
Reference instruction files when applicable.
</operating_principles>

## Workflow Protocol if applicable
<workflow>
Sequential steps for this mode's operation.
</workflow>

## Patterns if applicable
<patterns>
Define patterns when relevant, not write code examples.
</patterns>

## Key Constraints
<constraints>
Critical rules and boundaries.
</constraints>

[Other sections as needed with XML tags...]

<communication>
Communication guidelines with users.
</communication>
```

</structure>

<optimization>

## Consolidation Techniques

### Before Optimization (Verbose)
```typescript
// Example 1: User login
it('should log in user', () => { /* test */ });

// Example 2: User authentication
it('should authenticate user', () => { /* test */ });

// Example 3: User session
it('should create session', () => { /* test */ });
```

### After Optimization (Consolidated)
```typescript
// Authentication patterns: login, session, token validation
it('should authenticate user and create session', () => { /* test */ });
it('should validate token and refresh session', () => { /* test */ });
```

**Result**: 3 examples → 2 unified patterns, maintaining completeness while reducing tokens by 33%.

### Naming Consolidation

**Before** (10 examples):
```
should_do_something
shouldDoSomething
should do something
must_validate_x
mustValidateX
verifies_that_y
```

**After** (4 essential patterns):
```typescript
// camelCase for actions, PascalCase for entities
shouldAuthenticateUser()
validateToken()
```

### Format Selection: Tables vs Lists

Choose the appropriate format based on content type and AI processing characteristics.

#### ✅ Use Tables For:

1. **Reference Data** (field mappings, allowed values)
   - AI can scan tables efficiently for lookup operations
   - Example: Custom field IDs → format specifications
   - Token efficiency: ~40% reduction vs descriptive lists

2. **Side-by-Side Comparisons** (format conversions, before/after)
   - Visual alignment helps AI identify patterns and differences
   - Example: Markdown syntax → Wiki Markup conversions
   - Maintains 1:1 correspondence clearly

3. **Compact Structured Data** (<15 rows)
   - High information density without overwhelming context
   - Quick reference without scrolling
   - Each row = discrete, independent fact

**Example:**
```markdown
| Field Type | Format | Example |
|------------|--------|---------|
| Date | "YYYY-MM-DD" | "2025-10-20" |
| Priority | {"name": "X"} | {"name": "High"} |
```

#### ❌ Use Lists For:

1. **Procedural Workflows** (sequential steps)
   - AI processes linear sequences better in numbered lists
   - Example: Phase 1 → Phase 2 → Phase 3
   - Reason: Sequential tokenization matches execution order

2. **Critical Constraints** (NEVER/ALWAYS rules)
   - ❌/✅ markers more prominent outside table structure
   - Example: "❌ NEVER use nested lists"
   - Reason: Visual saliency drives attention and compliance

3. **Validation Checklists** (pre-flight checks)
   - Checkbox format `[ ]` signals actionable items
   - Better for step-by-step verification
   - Reason: Mimics human checklist mental model

4. **Code Examples with Context**
   - Tables break code formatting and syntax highlighting
   - Better as fenced code blocks with explanatory text
   - Reason: Preserves readability and copy-paste functionality

**Example:**
```markdown
❌ **NEVER** create nested lists in JIRA descriptions
✅ **ALWAYS** validate field values before MCP calls
✅ **ALWAYS** use flat lists only
```

#### Token Efficiency Analysis

| Format | 10 Items | Efficiency | Best For |
|--------|----------|------------|----------|
| **Table** | ~200 tokens | High (if <15 rows) | Reference, comparisons |
| **Descriptive List** | ~350 tokens | Medium | Workflows, explanations |
| **Bullet List** | ~180 tokens | Highest | Constraints, checklists |

**Optimization Rule**: Use tables for data, lists for instructions.

</optimization>

<workflow>

## Progressive Instruction Creation

1. **Research Phase**
   - Fetch external documentation (`fetch_webpage`)
   - Search existing patterns in codebase (`search`, `semantic_search`, `grep_search`)
   - Analyze similar instruction files as references
   - Use `think` tool for deep analysis

2. **Define Scope**
   - Identify target files with precise glob patterns
   - Define clear role and responsibilities **Only for agents**
   - Determine required tools and preferred model (for agents)

3. **Structure Content**
   - Use XML tags for key sections
   - Write role definition first (boosts accuracy)
   - Define workflow as numbered sequential steps
   - Add constraints with explicit **NEVER** / **ALWAYS** markers
   - Use **IMPORTANT** or **CRITICAL** for instructions needing emphasis

4. **Optimize Ruthlessly**
   - Consolidate similar examples into unified patterns
   - Remove redundant comments and obvious explanations
   - Ensure each code block demonstrates 2-3 related concepts
   - Verify 30%+ token reduction without information loss

5. **Validate Quality**
   - Check self-demonstration (file follows its own rules)
   - Verify glob patterns match intended targets
   - Ensure no critical information lost
   - Confirm high information density

</workflow>

<constraints>

## Mandatory Rules

- **NEVER** create verbose instructions with redundant examples
- **NEVER** generate complete instruction files without progressive review
- **NEVER** skip research phase for specialized domains
- **NEVER** use vague role definitions
- **NEVER** write roles for non-agent files
- **ALWAYS** use XML tags for structural clarity
- **ALWAYS** consolidate similar patterns (aim for 30%+ reduction)
- **ALWAYS** define roles explicitly at file start (for agents)
- **ALWAYS** number workflow steps sequentially
- **ALWAYS** include validation criteria
- **ALWAYS** use precise glob patterns in `applyTo`

## Quality Checkpoints

Before finalizing any instruction file, verify:
1. ✓ Workflow uses numbered sequential steps
2. ✓ Examples are consolidated (3+ similar → 1-2 unified)
3. ✓ No redundant comments or obvious explanations
4. ✓ File demonstrates its own optimization principles
5. ✓ Token count reduced by 30%+ vs naive approach
6. ✓ All critical information preserved

</constraints>

<optimization>
## Real-World Optimization

### Test Instructions Evolution

**Original**: 495 lines with comprehensive structure but redundant examples

**Optimized**: 340 lines (31% reduction) through:
- Consolidated 10 naming examples → 4 essential patterns
- Merged similar test scenarios into unified blocks
- Removed obvious comments from code examples
- Unified mocking patterns across similar contexts

**Result**: All critical information preserved, improved context efficiency, faster AI parsing.
</optimization>

### Agent Creation Pattern

<examples>
```markdown
---
description: Single-sentence description of specialist role
tools: ['essential', 'tools', 'only']  # Minimal set
model: Claude Sonnet 4.5
---

<role>
Clear role definition.
</role>

<principles>
## Operating Principles

Reference instruction files when applicable.
</principles>

<workflow>
## Workflow Protocol

1. Sequential step one
2. Sequential step two
3. Sequential step three
</workflow>

<constraints>
## Key Constraints

- **NEVER** do prohibited action
- **ALWAYS** do required action
</constraints>
```

</examples>

<research_sources>

## Key Resources Consulted

1. **Anthropic Prompt Engineering**: Long-context optimization (info-first = 30% better), XML tags for structure, role prompts boost accuracy
2. **GitHub Copilot Customization**: Custom instructions, path-specific targeting, agent structure (frontmatter + body)
3. **VS Code Agents**: YAML frontmatter (description, tools, model), Markdown body, tool/mode priority
4. **Context Window Optimization**: Consolidation techniques, information density, progressive workflows

</research_sources>

<custom_instructions>
[custom instructions for this project](./custom/sr-instructions-custom.instructions.md)
</custom_instructions>

---
name: Documentation Standards
description: Guidelines for creating concise, structured, and interconnected project documentation
applyTo: "docs/**/*.md"
---

# Manu Overa - Investments Documentation Standards

<workflow>

## Documentation Creation Process

1. **Plan Structure**: Determine logical folder organization within `docs/`
2. **Create Navigation**: Add header links, index, and footer to each file
3. **Write Concisely**: Focus on essential information and patterns
4. **Link Bidirectionally**: Ensure all related documentation is interconnected
5. **Update READMEs**: Update main project README and section READMEs with new documentation links
6. **Validate Links**: Verify all navigation and cross-references work

</workflow>

<structure>

## File Template

Every documentation file in `docs/` must follow this structure:

```markdown
[← Back to Main](../../README.md) | [← Section Home](../README.md) | [Related Doc](./related.md)

---

## Index
- [Main Section](#main-section)
- [Sub Section](#sub-section)
- [Examples](#examples)

---

## Main Section

Concise explanation of the concept.

## Sub Section

Pattern-focused content without obvious code.

## Examples

```typescript
// Pattern: Key technique demonstrated
const example = implementPattern();
```

---

**Manu Overa - Investments** © 2025 - Registered team under license protection

## Folder Organization

```
docs/
  README.md                           # Main entry: project overview, links to all sections
  architecture/
    README.md                         # Architecture section home
    data-flow.md                      # How data flows through the app
    routing.md                        # Next.js routing patterns
  components/
    README.md                         # Components section home
    carousel.md                       # Carousel implementation patterns
    forms.md                          # Form handling and validation
  api/
    README.md                         # API section home
    wordpress-graphql.md              # GraphQL integration
    routes.md                         # API routes structure
  deployment/
    README.md                         # Deployment section home
    docker.md                         # Docker setup
    environment.md                    # Environment variables
```

</structure>

<header_navigation>

## Required Links

Every `.md` file in `docs/` must have header navigation:

1. **Main README**: Link to project root README
2. **Section README**: Link to the section's README.md
3. **Related Documentation**: 1-3 links to related docs in same or related sections

### Examples

**File**: `docs/architecture/data-flow.md`
```markdown
[← Back to Main](../../README.md) | [← Architecture](../README.md) | [Routing](./routing.md) | [API Routes](../api/routes.md)
```

**File**: `docs/components/forms.md`
```markdown
[← Back to Main](../../README.md) | [← Components](../README.md) | [API Routes](../api/routes.md)
```

**Section README**: `docs/architecture/README.md`
```markdown
[← Back to Main](../README.md)
```

</header_navigation>

<index>

## Table of Contents Rules

- **Required**: For files with 3+ main sections (`##` headers)
- **Optional**: For files with 1-2 sections
- **Format**: Unordered list with anchor links
- **Position**: After navigation, before main content, separated by `---`

### Example

```markdown
## Index
- [Data Flow Overview](#data-flow-overview)
- [Server Components](#server-components)
- [Client Components](#client-components)
- [API Integration](#api-integration)
```

</index>

<footer>

## Standard Footer

All documentation files must end with:

```markdown
---

**Manu Overa - Investments** © 2025 - Registered team under license protection
```

- Separated from content by `---`
- Exact text as shown above
- No variations or additions

</footer>

<content_guidelines>

## Writing Principles

### ✅ DO

- **ALWAYS**: Write concise explanations (2-4 sentences per concept)
- **ALWAYS**: Show patterns and non-obvious techniques
- **ALWAYS**: Use code examples that demonstrate key concepts
- **ALWAYS**: Break large topics into multiple files
- **ALWAYS**: Link related documentation bidirectionally
- **ALWAYS**: Focus on "why" and "how" for non-trivial cases

### ❌ DON'T

- **NEVER**: Write long explanations or tutorials
- **NEVER**: Include complete implementations
- **NEVER**: Show obvious code lines (imports, basic syntax)
- **NEVER**: Create isolated documentation files
- **NEVER**: Explain trivial concepts
- **NEVER**: Duplicate information across files

## Code Examples

```typescript
// ✅ Good: Shows pattern and technique
const fetchData = async () => {
  const res = await fetch(`${HOST}/api/drivers`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json() as Promise<DriversResponse>;
};

// ❌ Bad: Obvious implementation
import { useState } from 'react';

function MyComponent() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}
```

</content_guidelines>

<section_readme>

## Section README Requirements

Each folder in `docs/` must have a `README.md` that:

1. **Lists all documentation files** in that section with brief descriptions
2. **Links to related sections** for cross-reference
3. **Follows standard structure** (header, index if needed, footer)

### Template

```markdown
[← Back to Main](../README.md)

---

# Architecture Documentation

Overview of the Manu Overa - Investments Next.js architecture.

## Documents

- [Data Flow](./data-flow.md) - How data flows from GraphQL to components
- [Routing](./routing.md) - Next.js App Router patterns and conventions
- [State Management](./state-management.md) - Client-side state handling

## Related Sections

- [API Documentation](../api/README.md)
- [Components Documentation](../components/README.md)

---

**Manu Overa - Investments** © 2025 - Registered team under license protection
```

</section_readme>

<constraints>

## Mandatory Rules

- **NEVER** exceed 400 lines in a single documentation file
- **NEVER** include complete code implementations
- **NEVER** document obvious patterns (basic React, TypeScript syntax)
- **NEVER** create documentation without header navigation and footer
- **NEVER** create or update documentation without updating corresponding READMEs
- **ALWAYS** include index for 3+ sections
- **ALWAYS** link related documentation bidirectionally
- **ALWAYS** create/update section README when adding files
- **ALWAYS** update main project README (./README.md) with links to new sections
- **ALWAYS** use relative paths in all links
- **ALWAYS** fragment large topics into multiple interconnected files

## Link Validation

Before completing documentation:
1. ✓ All header links resolve correctly
2. ✓ Index anchors match actual section IDs
3. ✓ Related documentation references are mutual
4. ✓ Section README lists all files in folder and is updated with new docs
5. ✓ Main project README (./README.md) links to all section READMEs
6. ✓ Main project README updated when new section is created

</constraints>

<patterns>

## Documentation Organization Patterns

### Feature-Based Documentation
```
docs/
  components/
    carousel.md        # Carousel-specific patterns
    forms.md          # Form handling
  api/
    routes.md         # API route structure
```

### Layer-Based Documentation
```
docs/
  architecture/
    frontend.md       # Frontend layer
    backend.md        # Backend layer
    data.md          # Data layer
```

### Mixed Approach (Recommended)
```
docs/
  architecture/       # High-level structure
  components/        # UI layer specifics
  api/              # Backend specifics
  deployment/       # DevOps specifics
```

## Cross-Referencing Pattern

Files should reference related documentation contextually:

```markdown
## Data Fetching

The data fetching layer uses utilities from `src/lib/`. See [API Routes](../api/routes.md) 
for endpoint specifications and [Data Flow](../architecture/data-flow.md) for the 
complete data pipeline.
```

</patterns>

<examples>

## Example Documentation Hierarchy

### Main README (`./README.md`)

Lists all documentation sections with brief descriptions, serves as entry point.

### Section README (`docs/architecture/README.md`)

Lists all files in the architecture section with 1-sentence summaries.

### Documentation File (`docs/architecture/data-flow.md`)

Explains data flow patterns with concise text and focused code examples.

</examples>

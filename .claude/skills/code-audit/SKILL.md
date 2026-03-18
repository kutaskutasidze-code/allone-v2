---
name: code-audit
description: Comprehensive code quality audit for backend and frontend. Identifies inefficiencies, redundancies, security issues, architectural problems, and provides actionable improvements. Use when you need a thorough code review.
user_invocable: true
---

# Code Audit Skill

## Overview

This skill performs a comprehensive, multi-dimensional code audit to ensure the highest quality standards. It analyzes code across 8 key dimensions and provides actionable recommendations.

## Audit Process

When invoked, follow this systematic audit process:

### Phase 1: Discovery
1. **Map the codebase structure** - Identify all relevant files and their relationships
2. **Identify the tech stack** - Framework versions, libraries, patterns used
3. **Understand data flow** - How data moves through the system

### Phase 2: Analysis (8 Dimensions)

#### 1. Architecture & Design Patterns
- [ ] Separation of concerns (presentation, business logic, data access)
- [ ] Consistent design patterns (Repository, Service, Factory, etc.)
- [ ] Module boundaries and dependencies
- [ ] Circular dependency detection
- [ ] Single Responsibility Principle adherence
- [ ] DRY (Don't Repeat Yourself) violations
- [ ] SOLID principles compliance

**Look for:**
```
- God classes/files doing too much
- Tight coupling between modules
- Missing abstraction layers
- Inconsistent patterns across similar features
```

#### 2. Code Quality & Cleanliness
- [ ] Naming conventions (files, functions, variables, types)
- [ ] Function/method size (should be < 50 lines ideally)
- [ ] File size (should be < 300 lines ideally)
- [ ] Cyclomatic complexity (deeply nested conditionals)
- [ ] Dead code (unused exports, unreachable code)
- [ ] Magic numbers/strings (should be constants)
- [ ] Proper TypeScript usage (no `any` abuse)

**Smell indicators:**
```typescript
// BAD: Magic numbers
if (status === 3) { ... }

// GOOD: Named constants
const STATUS_COMPLETED = 3;
if (status === STATUS_COMPLETED) { ... }

// BAD: Nested conditionals
if (a) { if (b) { if (c) { ... } } }

// GOOD: Early returns
if (!a) return;
if (!b) return;
if (!c) return;
// main logic
```

#### 3. Performance & Efficiency
- [ ] N+1 query problems
- [ ] Missing database indexes (inferred from query patterns)
- [ ] Unnecessary re-renders (React)
- [ ] Memory leaks (event listeners, subscriptions)
- [ ] Inefficient algorithms (O(n²) when O(n) possible)
- [ ] Missing caching opportunities
- [ ] Bundle size concerns (large imports)
- [ ] Unnecessary data fetching

**Look for:**
```typescript
// BAD: N+1 queries
const users = await getUsers();
for (const user of users) {
  const posts = await getPostsByUser(user.id); // Query per user!
}

// GOOD: Single query with join
const usersWithPosts = await getUsersWithPosts();
```

#### 4. Security
- [ ] SQL injection vulnerabilities
- [ ] XSS vulnerabilities
- [ ] CSRF protection
- [ ] Authentication/authorization gaps
- [ ] Sensitive data exposure (API keys, passwords in code)
- [ ] Input validation (missing or insufficient)
- [ ] Rate limiting on sensitive endpoints
- [ ] Proper error handling (no stack traces to client)

**Critical checks:**
```typescript
// BAD: SQL injection risk
const query = `SELECT * FROM users WHERE id = ${userId}`;

// GOOD: Parameterized queries
const { data } = await supabase.from('users').eq('id', userId);

// BAD: Sensitive data in response
return { user, password: user.password };

// GOOD: Exclude sensitive fields
return { user: { ...user, password: undefined } };
```

#### 5. Error Handling & Resilience
- [ ] Consistent error handling patterns
- [ ] Proper try-catch usage
- [ ] Error propagation strategy
- [ ] User-friendly error messages
- [ ] Logging strategy (structured logs)
- [ ] Graceful degradation
- [ ] Retry logic where appropriate

**Pattern to enforce:**
```typescript
// Standard error handling pattern
try {
  const result = await operation();
  return { data: result, error: null };
} catch (error) {
  console.error('Operation failed:', { error, context });
  return { data: null, error: 'User-friendly message' };
}
```

#### 6. API Design & Consistency
- [ ] RESTful conventions followed
- [ ] Consistent response formats
- [ ] Proper HTTP status codes
- [ ] API versioning strategy
- [ ] Request/response validation
- [ ] Documentation (OpenAPI/Swagger)
- [ ] Pagination for list endpoints

**Standard response format:**
```typescript
// Success
{ data: T, error: null }
{ data: T[], meta: { total, page, limit } }

// Error
{ data: null, error: string, code?: string }
```

#### 7. Database & Data Layer
- [ ] Schema design (normalization, indexes)
- [ ] Query efficiency
- [ ] Transaction usage where needed
- [ ] Migration strategy
- [ ] Data validation at DB level
- [ ] Proper use of RLS (Row Level Security)
- [ ] Connection pooling

#### 8. Testing & Maintainability
- [ ] Test coverage assessment
- [ ] Testable code structure
- [ ] Mocking strategy
- [ ] Integration test boundaries
- [ ] Documentation quality
- [ ] Code comments (why, not what)

### Phase 3: Reporting

Generate a structured report with:

```markdown
# Code Audit Report

## Executive Summary
- Overall health score: X/10
- Critical issues: N
- High priority: N
- Medium priority: N
- Low priority: N

## Critical Issues (Fix Immediately)
### Issue 1: [Title]
- **Location:** `path/to/file.ts:line`
- **Category:** Security/Performance/Architecture
- **Description:** What's wrong
- **Impact:** Why it matters
- **Fix:** Specific code change

## High Priority (Fix Soon)
...

## Medium Priority (Plan to Fix)
...

## Low Priority (Nice to Have)
...

## Refactoring Recommendations
### [Area Name]
- Current state
- Target state
- Migration path

## Architecture Improvements
- Diagram of current vs proposed

## Quick Wins
1. [Change] - 5 min effort, high impact
2. ...
```

### Phase 4: Implementation

For each issue found:
1. **Explain** the problem clearly
2. **Show** the current problematic code
3. **Provide** the corrected code
4. **Offer** to implement the fix

## Audit Scope Options

When starting an audit, ask about scope:
- **Full Audit**: All 8 dimensions, entire codebase
- **Backend Only**: API routes, database, server utilities
- **Frontend Only**: Components, hooks, state management
- **Security Focus**: Security dimension deep-dive
- **Performance Focus**: Performance dimension deep-dive
- **Quick Scan**: High-level overview, critical issues only

## Commands

```
/code-audit                    # Start interactive audit
/code-audit backend            # Audit backend only
/code-audit security           # Security-focused audit
/code-audit performance        # Performance-focused audit
/code-audit file path/to/file  # Audit specific file
```

## Quality Standards Reference

### File Organization
```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   └── (routes)/          # Page routes
├── components/
│   ├── ui/                # Reusable UI primitives
│   ├── sections/          # Page sections
│   └── [feature]/         # Feature-specific components
├── lib/
│   ├── supabase/          # Database client
│   ├── utils.ts           # Pure utility functions
│   └── [domain].ts        # Domain-specific logic
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript types
└── styles/                 # Global styles
```

### Naming Conventions
```typescript
// Files
user-profile.tsx           // kebab-case for files
UserProfile.tsx            // PascalCase for components (alternative)

// Components
export function UserProfile() {}   // PascalCase

// Functions
export function getUserById() {}   // camelCase

// Constants
export const MAX_RETRIES = 3;      // SCREAMING_SNAKE_CASE

// Types
type UserProfile = {}              // PascalCase
interface IUserService {}          // I-prefix for interfaces (optional)

// Database
table_name                         // snake_case
column_name                        // snake_case
```

### Code Metrics Thresholds
| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| File lines | < 200 | 200-400 | > 400 |
| Function lines | < 30 | 30-50 | > 50 |
| Cyclomatic complexity | < 5 | 5-10 | > 10 |
| Nesting depth | < 3 | 3-4 | > 4 |
| Parameters | < 4 | 4-5 | > 5 |

## Example Audit Output

```markdown
## Critical: SQL Injection Risk
**Location:** `src/app/api/users/route.ts:45`
**Category:** Security

**Current Code:**
\`\`\`typescript
const query = `SELECT * FROM users WHERE name LIKE '%${searchTerm}%'`;
\`\`\`

**Issue:** User input directly interpolated into SQL query.

**Fix:**
\`\`\`typescript
const { data } = await supabase
  .from('users')
  .ilike('name', `%${searchTerm}%`);
\`\`\`

---

## High: Duplicate Authentication Logic
**Locations:**
- `src/app/api/projects/route.ts:12-20`
- `src/app/api/services/route.ts:12-20`
- `src/app/api/clients/route.ts:12-20`

**Category:** Architecture (DRY violation)

**Current Code:** Authentication check repeated in 15 files.

**Fix:** Create middleware or utility:
\`\`\`typescript
// lib/auth.ts
export async function requireAuth(supabase: SupabaseClient) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new AuthError('Unauthorized');
  }
  return session;
}

// Usage in routes
const session = await requireAuth(supabase);
\`\`\`
```

## Continuous Improvement

After each audit:
1. Track issues found vs fixed
2. Update coding standards based on patterns
3. Add new checks for recurring issues
4. Build automated linting rules where possible

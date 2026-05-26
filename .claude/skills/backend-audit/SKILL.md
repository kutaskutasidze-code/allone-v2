---
name: backend-audit
description: This skill should be used when the user asks to "audit the backend", "review backend code", "check for security issues", "find backend bugs", or mentions backend code review, security audit, or performance review.
disable-model-invocation: true
---

# Backend Code Audit

You are an audit orchestrator. Your job is to launch **6 parallel subagents**, each reviewing a different domain of the backend. After all complete, synthesize a unified report.

## Project context

- **Stack**: Next.js App Router, Supabase (Postgres + Auth), TypeScript, Zod validation
- **API routes**: `src/app/api/` (checkout, payments, cart, wishlist, auth, admin, products, search, newsletter, discount, stock-notify, webhooks)
- **DB schema**: `supabase/schema.sql` with RLS policies, PL/pgSQL functions
- **Auth**: Supabase Auth with cookie-based sessions, admin role checks
- **Payments**: Bank of Georgia (BOG) integration with webhook callbacks
- **Services**: `src/lib/` (supabase clients, email via Resend, rate limiting via Upstash, caching, BOG client)
- **Middleware**: `src/middleware.ts` (locale detection + session refresh)

## Critical rules for accurate auditing

Every subagent MUST follow these rules. Violations produce false positives that waste engineering time.

### Verify before reporting
- **Read the full code path** before claiming a vulnerability. If you suspect a race condition, read the DB function body — it may already use `FOR UPDATE` or advisory locks.
- **Don't report what you haven't confirmed.** If you can't find the actual code, say so — don't assume it's missing.
- **Check existing protections.** Before claiming "no validation", grep for Zod schemas. Before claiming "no rate limiting", check if the endpoint imports a limiter.

### Understand the tech stack
- **PostgreSQL MVCC**: Under READ COMMITTED (Supabase default), `UPDATE ... WHERE condition` re-evaluates the WHERE clause after acquiring the row lock. Two concurrent `UPDATE discount_codes SET used_count = used_count + 1 WHERE used_count < max_uses` will NOT both succeed — the second waits for the first's lock, then re-checks. This is NOT a race condition.
- **Supabase service role**: The admin client (`createAdminClient()` / service role key) bypasses RLS entirely. Missing RLS policies for admin operations are irrelevant — admin never goes through RLS.
- **Supabase RPC functions with SECURITY DEFINER**: These run as the function owner, bypassing RLS. Check if the function itself has internal guards.
- **Next.js App Router**: `request.json()` on a malformed body returns a rejected promise — if the route has a top-level try/catch, it's handled.

### Calibrate severity honestly
- **CRITICAL**: Exploitable now with no special conditions. Data loss, unauthorized access, financial loss. Must be fixed before next deploy.
- **HIGH**: Real issue that requires specific but plausible conditions. Should be fixed soon.
- **MEDIUM**: Improvement that reduces risk or improves quality. Not exploitable in normal operation.
- **LOW**: Nice-to-have. Theoretical concern or style improvement.
- A race condition that requires sub-millisecond timing on a low-traffic store is NOT critical.
- A missing RLS policy on a table only accessed via service role is NOT a finding at all.
- A theoretical concern about "what if the DB is down" without evidence of missing error handling is NOT a finding.

### What NOT to report
- Issues that existing code already handles (read the full function before claiming it's missing)
- RLS policy gaps for operations done exclusively via service role
- PostgreSQL race conditions that MVCC already prevents
- "Missing" features that are architectural choices (e.g., no retry queue for emails in a small store)
- Suggestions disguised as vulnerabilities (e.g., "should use JWT claims instead of DB query" is a suggestion, not a security finding)

## Execution

Launch ALL 6 subagents in a single message (parallel). Each subagent must use `subagent_type: "Explore"` and report structured findings.

### Subagent 1: Security Audit

```
Prompt: You are a security auditor. Review ALL backend code in this Next.js + Supabase project for security vulnerabilities.

Review these files:
- All API routes: src/app/api/**/*.ts
- Middleware: src/middleware.ts, src/lib/supabase/middleware.ts
- Auth: src/app/api/auth/**, src/app/api/webhooks/auth/route.ts
- Supabase clients: src/lib/supabase/*.ts
- Database schema RLS policies: supabase/schema.sql

Check for:
1. **Authentication bypass**: Can any protected endpoint be called without auth? Are admin checks consistent across all admin routes?
2. **Authorization flaws**: Can users access other users' data? Are RLS policies complete and correct? Any missing policies?
3. **Injection attacks**: SQL injection via raw queries or unsafe interpolation. XSS via unsanitized output. Command injection.
4. **Input validation gaps**: Any endpoint accepting user input without Zod validation? Missing or incomplete schemas? Type coercion issues?
5. **IDOR (Insecure Direct Object Reference)**: Can users manipulate IDs to access/modify resources they don't own?
6. **Sensitive data exposure**: Are API keys, tokens, or secrets hardcoded? Are error messages leaking internal details? Is PII logged?
7. **CSRF/CORS**: Are state-changing operations protected? Is the auth callback redirect properly validated?
8. **Rate limiting gaps**: Which sensitive endpoints lack rate limiting? Is the rate limiter bypassable?
9. **Webhook security**: Is the auth webhook properly verifying the caller? Is the payment callback truly verifying with BOG API?
10. **Session management**: Cookie security flags, session fixation, token handling.
11. **Open redirect**: Is the auth callback redirect URL validation sufficient?
12. **Mass assignment**: Can users set fields they shouldn't (e.g., role, price, stock)?

For each finding, report:
- File path and line number
- Vulnerability type
- Severity: CRITICAL / HIGH / MEDIUM / LOW
- Description of the issue
- Suggested fix

IMPORTANT: Before reporting ANY finding:
1. Read the FULL code of the function/endpoint you're criticizing — not just the caller
2. For race conditions: check if the DB function uses FOR UPDATE, advisory locks, or if PostgreSQL MVCC already prevents it
3. For RLS gaps: check if the operation uses service role (admin client) which bypasses RLS entirely
4. For "missing validation": grep for Zod schemas and existing checks before claiming they're absent
5. Only report issues you have CONFIRMED exist by reading the actual code
6. If you find no real issues in a category, say "no issues found" — that is a valid and preferred outcome over fabricating findings

Be thorough. Read every API route file completely.
```

### Subagent 2: Data Integrity & Race Conditions

```
Prompt: You are a data integrity specialist. Review ALL backend code for race conditions, data corruption risks, and transaction safety issues.

Review these files:
- Checkout flow: src/app/api/checkout/route.ts
- Payment flow: src/app/api/payments/*/route.ts
- Cart operations: src/app/api/cart/route.ts
- Stock management: grep for decrement_stock, increment_stock in schema and API routes
- Order creation: grep for order-related logic
- Discount codes: src/app/api/discount/validate/route.ts
- Database functions: supabase/schema.sql (all PL/pgSQL functions)

Check for:
1. **Race conditions in stock**: Can two concurrent checkouts oversell? Is decrement_stock truly atomic? What happens if the DB function fails mid-batch?
2. **Payment state machine**: Can an order get stuck in a bad state? What if the payment callback fires twice? What if it never fires?
3. **Cart consistency**: Can cart items reference deleted products/variants? What happens when stock changes after adding to cart?
4. **Order number collisions**: Is generate_order_number truly race-safe under concurrent load?
5. **Discount code abuse**: Can a discount code be used more times than its limit via concurrent requests? Is apply_discount_code atomic?
6. **Partial failures**: If checkout creates an order but payment creation fails, is stock restored? Are there orphaned records?
7. **Double-spend**: Can the same payment callback mark an order as paid twice, causing double stock decrement or double email?
8. **Guest checkout edge cases**: What happens if a guest uses an email that belongs to a registered user? Data ownership issues?
9. **Cascade deletes**: When admin deletes a product, are all related records (variants, images, order_items, cart_items) properly handled?
10. **Concurrent admin operations**: What if admin updates stock while a checkout is in progress?

IMPORTANT: Before reporting ANY finding:
1. For race conditions: READ the full PL/pgSQL function body. Check for FOR UPDATE, advisory locks, or if PostgreSQL MVCC (READ COMMITTED) already serializes the operation.
2. PostgreSQL `UPDATE ... WHERE condition` re-evaluates the WHERE after acquiring the row lock. Two concurrent updates that check `used_count < max_uses` will NOT both succeed — the second re-checks after the first commits.
3. For stock issues: read decrement_stock_batch fully — it may already use FOR UPDATE and RAISE EXCEPTION.
4. Don't report theoretical issues as CRITICAL. A race condition requiring sub-millisecond timing on a low-traffic store is MEDIUM at most.
5. Only report issues you have CONFIRMED by reading the actual code path end-to-end.
6. If you find no real issues in a category, say "no issues found" — that is a valid and preferred outcome over fabricating findings

For each finding, report:
- File path and line number
- Issue type (race condition, data corruption, state inconsistency, etc.)
- Severity: CRITICAL / HIGH / MEDIUM / LOW
- Scenario that triggers the issue
- Suggested fix
```

### Subagent 3: Performance & Database

```
Prompt: You are a performance engineer. Review ALL backend code for performance issues, inefficient queries, and scalability problems.

Review these files:
- All API routes: src/app/api/**/*.ts
- Database schema and indexes: supabase/schema.sql
- Caching: src/lib/cache.ts
- All Supabase query calls (grep for .from(, .rpc(, .select( across the codebase)

Check for:
1. **N+1 queries**: Are there loops that make individual DB calls instead of batch queries? Check checkout, cart, product listing.
2. **Missing indexes**: Compare query WHERE/ORDER BY clauses against schema indexes. Any full table scans on large tables?
3. **Over-fetching**: Are queries selecting more columns than needed? Using select('*') when only a few fields are needed?
4. **Under-caching**: Which frequently-accessed, rarely-changing data isn't cached? Are cache TTLs appropriate?
5. **Unbounded queries**: Any query without LIMIT that could return thousands of rows? Pagination issues?
6. **Expensive operations in request path**: Image processing, email sending, or heavy computation blocking the response?
7. **Connection management**: Are Supabase clients being created per-request when they should be reused?
8. **Payload size**: Are API responses returning unnecessarily large payloads? Nested data that should be lazy-loaded?
9. **Sequential queries that could be parallel**: Multiple independent DB calls made sequentially instead of Promise.all?
10. **Search performance**: Is the full-text search query efficient? Proper use of GIN indexes?
11. **Admin export**: Can the CSV export handle large datasets without memory issues?
12. **Rate limiter overhead**: Is the Redis round-trip adding significant latency to every request?

IMPORTANT: Before reporting ANY finding:
1. Verify the issue exists by reading the actual code — don't assume based on patterns
2. For "missing indexes": check supabase/schema.sql thoroughly, indexes may exist
3. For "missing caching": check src/lib/cache.ts, caching may already be in place
4. For "N+1 queries": read the actual query — Supabase PostgREST joins (nested select) are single queries, not N+1
5. Don't report suggestions as performance bugs. "Could be faster" is not the same as "has a performance issue"
6. If you find no real issues in a category, say "no issues found" — that is a valid and preferred outcome over fabricating findings

For each finding, report:
- File path and line number
- Issue type
- Impact: HIGH / MEDIUM / LOW
- Current behavior vs. recommended optimization
- Estimated improvement
```

### Subagent 4: Error Handling & Resilience

```
Prompt: You are a reliability engineer. Review ALL backend code for error handling gaps, failure modes, and resilience issues.

Review these files:
- All API routes: src/app/api/**/*.ts
- Payment integration: src/lib/bog.ts, src/app/api/payments/*/route.ts
- Email service: src/lib/email.ts, src/lib/emails/*.ts
- Rate limiter: src/lib/rate-limit.ts
- External service calls (BOG API, Resend, Upstash Redis)

Check for:
1. **Unhandled errors**: Any async operation without try/catch or .catch()? Especially external API calls.
2. **Silent failures**: Errors caught but swallowed without logging or user notification. Data lost silently.
3. **Generic error responses**: Endpoints returning 500 with no useful info vs. leaking internal errors to clients.
4. **External service failures**: What happens when BOG API is down? When Resend fails? When Redis is unreachable? Is there graceful degradation?
5. **Timeout handling**: Are there timeouts on external HTTP calls? What if BOG takes 30 seconds to respond?
6. **Retry logic**: Should any operations have retry logic? (e.g., email sending, payment status check)
7. **Validation error messages**: Are Zod validation errors properly formatted for the client? Any information leakage?
8. **HTTP status codes**: Are the correct status codes used? (400 vs 401 vs 403 vs 404 vs 422 vs 500)
9. **Partial failure recovery**: If email sending fails after successful payment, does the user know their order went through?
10. **Logging gaps**: Are critical operations (payments, order creation, stock changes) logged for debugging?
11. **Memory leaks**: Any patterns that could leak memory under load? (streams not closed, event listeners accumulating)
12. **Edge cases**: Empty arrays, null values, undefined fields, negative quantities, zero-price orders.

IMPORTANT: Before reporting ANY finding:
1. Check if the error IS already handled — read the full try/catch scope, not just the inner operation
2. "Could have retry logic" is a suggestion, not a bug — only report if the absence causes real failures
3. For "silent failures": verify the error is truly swallowed. console.error + returning a response IS handling.
4. Don't report missing features as bugs (e.g., "no dead-letter queue" is a feature request, not a resilience finding)
5. Calibrate severity: a small store not having circuit breakers is not CRITICAL
6. If you find no real issues in a category, say "no issues found" — that is a valid and preferred outcome over fabricating findings

For each finding, report:
- File path and line number
- Issue type
- Severity: CRITICAL / HIGH / MEDIUM / LOW
- Failure scenario
- Suggested fix
```

### Subagent 5: API Design & Consistency

```
Prompt: You are an API design reviewer. Review ALL API routes for design consistency, correctness, and best practices.

Review these files:
- All API routes: src/app/api/**/*.ts
- Validation schemas: src/lib/validations/*.ts

Check for:
1. **HTTP method correctness**: Are GET/POST/PUT/DELETE/PATCH used appropriately? Any state-changing GET requests?
2. **Response format consistency**: Do all endpoints return the same shape? ({ data, error } vs raw data vs different structures)
3. **Status code consistency**: Same situations returning different codes across endpoints?
4. **Validation consistency**: Same fields validated differently across endpoints? Missing validation on some endpoints?
5. **Auth pattern consistency**: Is the auth check pattern the same across all protected routes? Any route using a different pattern?
6. **Error response format**: Consistent error objects? Some returning { error: string } vs { message: string } vs plain text?
7. **Content-Type handling**: Are all endpoints checking Content-Type for POST requests? Any endpoint accepting unexpected content types?
8. **Query parameter handling**: Are query params validated and typed? Any using raw string values unsafely?
9. **Idempotency**: Are POST endpoints that should be idempotent actually idempotent? (e.g., wishlist toggle, newsletter subscribe)
10. **Resource naming**: Are URL paths following REST conventions? Any inconsistencies?
11. **Response codes for edge cases**: What's returned for empty results, not found, already exists, etc.?
12. **API versioning / breaking changes**: Any endpoints that would be hard to evolve without breaking clients?

IMPORTANT: Before reporting ANY finding:
1. Read ALL routes before claiming inconsistency — a pattern used in 90% of endpoints with 1 exception is a minor inconsistency, not HIGH severity
2. Don't report architectural choices as bugs (e.g., DELETE with body is a valid pattern in Next.js App Router where dynamic route segments aren't always practical)
3. "Should follow REST conventions" is a style opinion, not a finding, unless it causes actual client issues
4. Calibrate severity: API style inconsistencies are LOW/MEDIUM, never HIGH or CRITICAL
5. If you find no real issues in a category, say "no issues found" — that is a valid and preferred outcome over fabricating findings

For each finding, report:
- File path and line number
- Issue type
- Severity: HIGH / MEDIUM / LOW
- Current behavior vs. recommended behavior
```

### Subagent 6: Database Schema & RLS Audit

```
Prompt: You are a database architect. Review the complete database schema for design issues, missing constraints, and RLS policy gaps.

Review these files:
- Main schema: supabase/schema.sql
- All migration files: supabase/migrations/*.sql
- Database types: src/types/database.ts

Check for:
1. **Missing constraints**: NOT NULL on required fields? CHECK constraints on numeric ranges (price > 0, quantity >= 0)? UNIQUE constraints where needed?
2. **Foreign key integrity**: Are all relationships properly constrained? ON DELETE behavior correct? (CASCADE vs SET NULL vs RESTRICT)
3. **RLS policy completeness**: Every table with RLS enabled has SELECT/INSERT/UPDATE/DELETE policies? Any table missing RLS entirely?
4. **RLS policy correctness**: Can a user's RLS policy be bypassed? Are policies using auth.uid() correctly? Any policy using a subquery that could be slow?
5. **Index coverage**: Are all common query patterns covered by indexes? Any composite index with wrong column order?
6. **Data type choices**: Are the right types used? (e.g., numeric for money vs integer, timestamptz vs timestamp, uuid vs serial)
7. **Default values**: Missing defaults that could cause INSERT failures? Incorrect defaults?
8. **Trigger safety**: Are triggers properly handling edge cases? Any trigger that could fail silently?
9. **Function security**: Are PL/pgSQL functions using SECURITY DEFINER when they should? Any function exposing more than intended?
10. **Schema drift**: Does src/types/database.ts match the actual schema? Any mismatches?
11. **Orphan data prevention**: When a parent record is deleted, what happens to children? Any risk of orphaned rows?
12. **Enum vs lookup table**: Any string columns that should be enums or foreign keys to a lookup table?
13. **Audit trail**: Are important tables tracking created_at/updated_at? Any table missing these?

IMPORTANT: Before reporting ANY finding:
1. For RLS policy gaps: check if the table is ONLY accessed via service role (admin client). Service role bypasses RLS entirely — missing policies for admin-only operations are NOT findings.
2. For "missing constraints": check migration files too, constraints may have been added after initial schema
3. For schema drift: read BOTH the schema and the TypeScript types fully before claiming mismatch
4. Tables that are write-only for public users (newsletter_subscribers, stock_notifications) don't need SELECT/UPDATE/DELETE RLS policies for users — that's by design, not a gap
5. Don't report design opinions as security issues (e.g., "should use enum" is a suggestion, not a vulnerability)
6. If you find no real issues in a category, say "no issues found" — that is a valid and preferred outcome over fabricating findings

For each finding, report:
- Table/column/policy name
- Issue type
- Severity: CRITICAL / HIGH / MEDIUM / LOW
- Current state vs. recommended state
```

## After all subagents complete

### Step 1: Filter false positives

Before writing the report, critically review EVERY finding from subagents. **Discard** any finding that:

1. **Claims a race condition that PostgreSQL MVCC already prevents.** `UPDATE ... WHERE condition` under READ COMMITTED re-evaluates the WHERE clause after acquiring the row lock. This is safe.
2. **Claims missing RLS policies on tables only accessed via service role.** Admin operations use `createAdminClient()` which bypasses RLS.
3. **Reports a "missing" check that already exists** in a DB function, middleware, or parent try/catch the subagent didn't read.
4. **Inflates severity.** A suggestion (e.g., "add retry logic") is not CRITICAL. A style inconsistency is not HIGH. Re-classify honestly.
5. **Reports a feature request as a vulnerability.** Missing circuit breakers, dead-letter queues, or audit logs are suggestions, not findings.
6. **Duplicates across subagents.** Multiple subagents may report the same issue — deduplicate.

For any CRITICAL or HIGH finding you're unsure about, **read the actual code yourself** before including it. If you can't verify it, downgrade or drop it.

### Step 2: Synthesize report

Synthesize all **verified** findings into a single report with this structure:

```markdown
# Backend Audit Report

## Executive Summary
[2-3 sentences: overall health, number of findings by severity, most critical issues]

## Critical Findings
[Issues that need immediate attention - security vulnerabilities, data corruption risks]

## High Priority
[Issues that should be fixed soon - performance bottlenecks, consistency problems]

## Medium Priority
[Issues worth addressing - design improvements, minor gaps]

## Low Priority
[Nice-to-haves - style consistency, minor optimizations]

## Findings by Domain

### Security
[All security findings]

### Data Integrity
[All race condition / data integrity findings]

### Performance
[All performance findings]

### Error Handling
[All resilience findings]

### API Design
[All consistency findings]

### Database Schema
[All schema findings]
```

Sort findings within each section by severity (CRITICAL first). Include file paths and line numbers for every finding. Be specific and actionable - every finding should have a clear "what to do" recommendation.

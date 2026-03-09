---
name: fix
description: Run typechecking and linting, then spawn parallel agents to fix all issues
---

## Step 1: Run Checks

Run both checks and capture output:

```bash
cd /Users/macintoshi/projects/allone-website && npx tsc --noEmit 2>&1; echo "---LINT---"; npx eslint . 2>&1
```

## Step 2: Parse and Group Errors

Group all errors into:
- **Type errors** from tsc
- **Lint errors** from eslint

List affected files and specific errors for each domain.

## Step 3: Fix in Parallel

Spawn parallel agents (one per domain with errors) using the Agent tool. Each agent receives:
1. The list of files and specific errors in their domain
2. Instructions to fix all errors
3. Must re-run the relevant check to verify fixes

## Step 4: Verify

After agents complete, re-run both checks to confirm zero errors:

```bash
cd /Users/macintoshi/projects/allone-website && npx tsc --noEmit && npx eslint .
```

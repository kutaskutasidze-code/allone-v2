---
name: commit
description: Run checks, commit with AI message, and push
---

1. Run quality checks:
   ```bash
   cd /Users/macintoshi/projects/allone-website && npx tsc --noEmit && npx eslint .
   ```
   Fix ALL errors before continuing.

2. Review changes: `git status` and `git diff --staged` and `git diff`

3. Stage relevant files (avoid .env, credentials). Generate a commit message:
   - Start with verb (Add/Update/Fix/Remove/Refactor)
   - Be specific and concise, one line

4. Commit and push:
   ```bash
   git add -A && git commit -m "message" && git push
   ```

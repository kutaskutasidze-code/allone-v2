# Supabase DB webhook → recruiter ingest

Supabase Dashboard → Database → Webhooks → Create:

- Table: `public.job_applications`
- Events: INSERT
- Type: HTTP Request, POST
- URL: https://app.allonelabs.com/api/recruiter/ingest/web (prod CRM origin)
- HTTP Headers: `x-webhook-secret: <RECRUITER_WEBHOOK_SECRET>`

Supabase sends `{ "type":"INSERT", "table":"job_applications", "record": {...} }`.
The route reads `record`.

## Required Vercel env vars (set on `allone-perf` project)

| Key                            | Value                                             |
| ------------------------------ | ------------------------------------------------- |
| `RECRUITER_WEBHOOK_SECRET`     | same value as the header above                    |
| `PLANE_API_KEY`                | from Keychain `plane-api-token`                   |
| `PLANE_RECRUITMENT_PROJECT_ID` | `8a1b558b-a4ff-454b-b53e-7857dd17dea6`            |
| `PLANE_BASE_URL`               | `https://plane.allonelabs.com`                    |
| `PLANE_WORKSPACE`              | `allone`                                          |
| `RECRUITER_SENDING_ENABLED`    | `false` (dry-run; flip to `true` for Increment 2) |

`CLAUDE_BRIDGE_URL` and `CLAUDE_BRIDGE_TOKEN` are already set on `allone-perf`.

## Notes

- The route is idempotent: rows with `ai_ranked_at` already set return `{ skipped: true }`.
- Low-confidence candidates (`confidence < 0.6`) or rows without an email are held with `status = "reviewing"` — no Plane card is created.
- No email is sent in this increment (`RECRUITER_SENDING_ENABLED=false`).
- CV formats supported: `.pdf` (pdf-parse v2 via `PDFParse`) and `.docx`/`.doc` (mammoth). Other formats are held.

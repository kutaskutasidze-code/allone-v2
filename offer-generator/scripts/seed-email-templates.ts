// Idempotent seed: upserts the universal cold-outreach email templates used
// by the sales→demo pipeline. Run after the pipeline migration is applied.
//
//   pnpm tsx scripts/seed-email-templates.ts

import { supabase } from "../src/database/client.js";
import { logger } from "../src/utils/logger.js";
import { SEEDABLE_TEMPLATES } from "../src/email-drafter/templates.js";

async function main() {
  for (const t of SEEDABLE_TEMPLATES) {
    const { data: existing, error: lookupErr } = await supabase
      .from("email_templates")
      .select("id, name")
      .eq("name", t.name)
      .maybeSingle();

    if (lookupErr) {
      logger.error("seed-email-templates: lookup failed", {
        name: t.name,
        error: lookupErr.message,
      });
      continue;
    }

    const payload = {
      name: t.name,
      description: t.description,
      subject: t.subject,
      body: t.body,
      target_service: t.target_service,
      language: t.language,
      segment: t.segment,
      lead_source: t.lead_source,
      swap_variables: t.swap_variables,
      is_active: true,
    };

    if (existing) {
      const { error } = await supabase
        .from("email_templates")
        .update(payload)
        .eq("id", existing.id);
      if (error) {
        logger.error("seed-email-templates: update failed", {
          name: t.name,
          error: error.message,
        });
      } else {
        logger.info("seed-email-templates: updated", { name: t.name });
      }
    } else {
      const { error } = await supabase.from("email_templates").insert(payload);
      if (error) {
        logger.error("seed-email-templates: insert failed", {
          name: t.name,
          error: error.message,
        });
      } else {
        logger.info("seed-email-templates: inserted", { name: t.name });
      }
    }
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

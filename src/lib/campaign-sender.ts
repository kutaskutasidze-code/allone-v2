import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

// Outbound email-campaign sender. Walks active email_campaigns, selects matching
// leads (service / relevance / country) that have never been emailed, respects a
// per-campaign daily_limit, personalizes body_template, sends via Resend, and
// logs every attempt to email_logs (which also drives dedup + counters).
//
// SAFETY: gated by `enabled`. When false (the default — see the cron route), it
// runs a DRY RUN: it selects and counts candidates but sends nothing and writes
// no email_logs. Nothing goes out until CAMPAIGNS_SENDING_ENABLED=true.

interface CampaignRow {
  id: string;
  name: string;
  subject: string;
  body_template: string;
  target_service: string | null;
  target_countries: string[] | null;
  min_relevance_score: number | null;
  daily_limit: number | null;
  emails_sent: number | null;
}

interface LeadRow {
  id: string;
  name: string | null;
  company: string | null;
  email: string | null;
  industry: string | null;
}

export interface CampaignRunSummary {
  dryRun: boolean;
  campaigns: number;
  sent: number;
  failed: number;
  wouldSend: number;
}

function fill(tpl: string, lead: LeadRow): string {
  return tpl
    .replaceAll("{{company}}", lead.company?.trim() || "your company")
    .replaceAll("{{name}}", lead.name?.trim() || "there")
    .replaceAll("{{industry}}", lead.industry?.trim() || "your industry")
    .replaceAll(
      "{{unsubscribe_link}}",
      "mailto:team@allonelabs.com?subject=Unsubscribe",
    );
}

function startOfUtcDayIso(nowIso: string): string {
  return `${nowIso.slice(0, 10)}T00:00:00.000Z`;
}

export async function runCampaigns(
  db: SupabaseClient,
  opts: { enabled: boolean; apiKey: string; from: string },
): Promise<CampaignRunSummary> {
  const summary: CampaignRunSummary = {
    dryRun: !opts.enabled,
    campaigns: 0,
    sent: 0,
    failed: 0,
    wouldSend: 0,
  };

  const { data: campaigns, error } = await db
    .from("email_campaigns")
    .select("*")
    .eq("is_active", true);
  if (error) {
    logger.error("runCampaigns: load failed", { error: error.message });
    return summary;
  }

  const nowIso = new Date().toISOString();
  const dayStart = startOfUtcDayIso(nowIso);

  for (const c of (campaigns ?? []) as CampaignRow[]) {
    summary.campaigns++;

    const { count: sentToday } = await db
      .from("email_logs")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", c.id)
      .gte("created_at", dayStart)
      .in("status", ["sent", "delivered", "opened", "clicked", "replied"]);
    const remaining = (c.daily_limit ?? 50) - (sentToday ?? 0);
    if (remaining <= 0) continue;

    let q = db
      .from("leads")
      .select("id, name, company, email, industry")
      .eq("status", "new")
      .not("email", "is", null)
      .gte("relevance_score", c.min_relevance_score ?? 0)
      .is("email_sent_at", null) // never-emailed → global dedup, avoids spam
      .limit(remaining);
    if (c.target_service) q = q.eq("matched_service", c.target_service);
    if (Array.isArray(c.target_countries) && c.target_countries.length > 0)
      q = q.in("country", c.target_countries);

    const { data: leads, error: leadErr } = await q;
    if (leadErr) {
      logger.error("runCampaigns: lead select failed", {
        error: leadErr.message,
        resourceId: c.id,
      });
      continue;
    }
    const targets = (leads ?? []) as LeadRow[];
    if (targets.length === 0) continue;

    if (!opts.enabled) {
      summary.wouldSend += targets.length;
      logger.info("runCampaigns: DRY RUN", {
        campaign: c.name,
        wouldSend: targets.length,
      });
      continue;
    }

    let sentThisCampaign = 0;
    for (const lead of targets) {
      if (!lead.email) continue;
      let status = "sent";
      let providerId: string | null = null;
      let errorMessage: string | null = null;
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${opts.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: opts.from,
            to: lead.email,
            subject: fill(c.subject, lead),
            html: fill(c.body_template, lead),
          }),
        });
        const j = (await res.json().catch(() => ({}))) as {
          id?: string;
          message?: string;
        };
        if (!res.ok) {
          status = "failed";
          errorMessage = j.message ?? `http ${res.status}`;
        } else {
          providerId = j.id ?? null;
        }
      } catch (err) {
        status = "failed";
        errorMessage = err instanceof Error ? err.message : String(err);
      }

      await db.from("email_logs").insert({
        lead_id: lead.id,
        campaign_id: c.id,
        to_email: lead.email,
        subject: c.subject,
        status,
        sent_at: status === "sent" ? new Date().toISOString() : null,
        error_message: errorMessage,
        email_provider_id: providerId,
      });

      if (status === "sent") {
        await db
          .from("leads")
          .update({ email_sent_at: new Date().toISOString() })
          .eq("id", lead.id);
        summary.sent++;
        sentThisCampaign++;
      } else {
        summary.failed++;
      }
    }

    if (sentThisCampaign > 0) {
      await db
        .from("email_campaigns")
        .update({ emails_sent: (c.emails_sent ?? 0) + sentThisCampaign })
        .eq("id", c.id);
    }
  }

  return summary;
}

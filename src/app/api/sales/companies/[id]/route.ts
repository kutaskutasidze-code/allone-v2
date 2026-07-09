import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/sales-auth";
import {
  authErrorResponse,
  success,
  error,
  notFound,
  validationError,
} from "@/lib/api-response";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCompanyById, submissionsForCompany } from "@/lib/feedback/db";
import { encrypt, decrypt, sha256hex, generateToken, generatePassword } from "@/lib/feedback/crypto";
import { hashPassword } from "@/lib/feedback/passwords";
import { feedbackConfig } from "@/lib/feedback/config";
import { sendOnboardingEmail } from "@/lib/feedback/email";
import { issueUrl } from "@/lib/feedback/plane";
import type { FeedbackCompany } from "@/lib/feedback/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function origin(request: NextRequest): string {
  return feedbackConfig.baseUrl || new URL(request.url).origin;
}

// Safe subset of a company for the admin detail view (no encrypted blobs / hashes).
function publicCompany(c: FeedbackCompany) {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    login_email: c.login_email,
    contact_email: c.contact_email,
    phone: c.phone,
    comms_language: c.comms_language,
    plane_label_id: c.plane_label_id,
    is_active: c.is_active,
    created_at: c.created_at,
    rotated_at: c.rotated_at,
  };
}

// GET — full detail incl. the (decrypted) magic link + password + submissions.
export async function GET(request: NextRequest, { params }: Ctx) {
  try {
    await requireRole(["admin", "supervisor"]);
    const { id } = await params;
    const company = await getCompanyById(id);
    if (!company) return notFound("Company");

    const link = `${origin(request)}/feedback/c/${decrypt(company.access_token_enc)}`;
    const password = company.password_enc ? decrypt(company.password_enc) : null;
    const rawSubs = await submissionsForCompany(id);
    const submissions = rawSubs.map((s) => ({
      ...s,
      plane_url: s.plane_issue_id ? issueUrl(s.plane_issue_id) : null,
    }));

    return success({ company: publicCompany(company), link, password, submissions });
  } catch (err) {
    return authErrorResponse(err);
  }
}

const patchSchema = z.object({
  action: z.enum(["rotate_link", "reset_password", "resend_onboarding", "set_active", "set_language"]),
  is_active: z.boolean().optional(),
  comms_language: z.enum(["ka", "en"]).optional(),
});

// PATCH — admin actions on a company.
export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    await requireRole(["admin", "supervisor"]);
    const { id } = await params;
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const company = await getCompanyById(id);
    if (!company) return notFound("Company");
    const supabase = createAdminClient();

    switch (parsed.data.action) {
      case "rotate_link": {
        const token = generateToken();
        await supabase
          .from("feedback_companies")
          .update({
            access_token_enc: encrypt(token),
            token_lookup: sha256hex(token),
            rotated_at: new Date().toISOString(),
          })
          .eq("id", id);
        return success({ link: `${origin(request)}/feedback/c/${token}` });
      }
      case "reset_password": {
        const password = generatePassword();
        await supabase
          .from("feedback_companies")
          .update({
            password_hash: hashPassword(password),
            password_enc: encrypt(password),
            failed_attempts: 0,
            locked_until: null,
          })
          .eq("id", id);
        return success({ password });
      }
      case "resend_onboarding": {
        if (!company.contact_email) return error("No contact email on file", 400);
        const token = decrypt(company.access_token_enc);
        const r = await sendOnboardingEmail({
          to: company.contact_email,
          companyName: company.name,
          portalUrl: `${origin(request)}/feedback/c/${token}`,
          locale: company.comms_language,
        });
        return success({ emailSent: r.sent, reason: r.reason });
      }
      case "set_active": {
        const next = parsed.data.is_active ?? !company.is_active;
        await supabase.from("feedback_companies").update({ is_active: next }).eq("id", id);
        return success({ is_active: next });
      }
      case "set_language": {
        const lang = parsed.data.comms_language ?? company.comms_language;
        await supabase.from("feedback_companies").update({ comms_language: lang }).eq("id", id);
        return success({ comms_language: lang });
      }
      default:
        return error("Unknown action", 400);
    }
  } catch (err) {
    return authErrorResponse(err);
  }
}

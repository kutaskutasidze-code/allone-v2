import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/sales-auth";
import { authErrorResponse, success, error, validationError } from "@/lib/api-response";
import { createAdminClient } from "@/lib/supabase/admin";
import { listCompanies, uniqueSlug } from "@/lib/feedback/db";
import {
  encrypt,
  sha256hex,
  generateToken,
  generatePassword,
  slugify,
} from "@/lib/feedback/crypto";
import { hashPassword } from "@/lib/feedback/passwords";
import { feedbackConfig } from "@/lib/feedback/config";
import { sendOnboardingEmail } from "@/lib/feedback/email";
import * as plane from "@/lib/feedback/plane";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET — list companies (admin/supervisor). Secrets are never returned here.
export async function GET() {
  try {
    await requireRole(["admin", "supervisor"]);
    const companies = await listCompanies();
    const data = companies.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      login_email: c.login_email,
      contact_email: c.contact_email,
      comms_language: c.comms_language,
      is_active: c.is_active,
      created_at: c.created_at,
    }));
    return success(data);
  } catch (err) {
    return authErrorResponse(err);
  }
}

const createSchema = z.object({
  name: z.string().trim().min(1),
  contact_email: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  comms_language: z.enum(["ka", "en"]).optional(),
});

// POST — create a company: generate link + creds + Plane label, insert, email onboarding.
export async function POST(request: NextRequest) {
  try {
    await requireRole(["admin", "supervisor"]);
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const name = parsed.data.name;
    const comms_language = parsed.data.comms_language ?? "ka";
    const rawEmail = (parsed.data.contact_email ?? "").toLowerCase();
    if (rawEmail && !EMAIL_RE.test(rawEmail)) return error("Invalid contact email", 400);
    const contact_email = rawEmail || null;
    const phone = parsed.data.phone || null;

    const slug = await uniqueSlug(slugify(name));
    const token = generateToken();
    const password = generatePassword();
    const loginEmail = `${slug}@${feedbackConfig.clientEmailDomain}`;

    // Per-company Plane label (best-effort; submissions still tag via [Company] prefix).
    let labelId: string | null = null;
    if (feedbackConfig.plane.configured) {
      try {
        labelId = await plane.ensureLabel(name);
      } catch {
        /* non-fatal */
      }
    }

    const supabase = createAdminClient();
    const { data: inserted, error: dbErr } = await supabase
      .from("feedback_companies")
      .insert({
        name,
        slug,
        access_token_enc: encrypt(token),
        token_lookup: sha256hex(token),
        login_email: loginEmail,
        password_hash: hashPassword(password),
        password_enc: encrypt(password),
        contact_email,
        phone,
        comms_language,
        plane_workspace: feedbackConfig.plane.workspace,
        plane_project_id: feedbackConfig.plane.projectId,
        plane_label_id: labelId,
        is_active: true,
      })
      .select("id")
      .single();

    if (dbErr || !inserted) return error(dbErr?.message || "Failed to create company");
    const id = (inserted as { id: string }).id;

    const origin = feedbackConfig.baseUrl || new URL(request.url).origin;
    const portalUrl = `${origin}/feedback/c/${token}`;

    let emailSent = false;
    if (contact_email) {
      const r = await sendOnboardingEmail({
        to: contact_email,
        companyName: name,
        portalUrl,
        locale: comms_language,
      });
      emailSent = r.sent;
    }

    return success({ id, portalUrl, loginEmail, password, emailSent }, 201);
  } catch (err) {
    return authErrorResponse(err);
  }
}

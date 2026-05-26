import { revalidatePath } from "next/cache";
import { requireSalesAuth } from "@/lib/sales-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AuthError } from "@/lib/auth";
import {
  success,
  error,
  validationError,
  unauthorized,
  notFound,
  forbidden,
} from "@/lib/api-response";
import { updateLeadSchema } from "@/lib/validations/leads";
import { idParamSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";
import { teardownDemosForLead } from "@/lib/demo-pipeline-trigger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { salesUser } = await requireSalesAuth();
    const { id } = await params;

    const idResult = idParamSchema.safeParse({ id });
    if (!idResult.success) return validationError(idResult.error);

    const supabase = createAdminClient();
    const { data, error: dbError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .single();

    if (dbError) {
      if (dbError.code === "PGRST116") return notFound("Lead");
      return error("Failed to fetch lead");
    }

    const canSeeAll =
      salesUser.role === "supervisor" || salesUser.role === "admin";
    if (!canSeeAll && data.sales_user_id !== salesUser.id) return forbidden();

    return success(data);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    return error("Internal server error");
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { salesUser } = await requireSalesAuth();
    const { id } = await params;
    const body = await request.json();

    const idResult = idParamSchema.safeParse({ id });
    if (!idResult.success) return validationError(idResult.error);

    const result = updateLeadSchema.safeParse(body);
    if (!result.success) return validationError(result.error);

    const supabase = createAdminClient();

    const { data: existingLead, error: fetchError } = await supabase
      .from("leads")
      .select("sales_user_id, status")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") return notFound("Lead");
      return error("Failed to fetch lead");
    }

    const canSeeAll =
      salesUser.role === "supervisor" || salesUser.role === "admin";
    const isOwn = existingLead.sales_user_id === salesUser.id;
    const isUnassigned = !existingLead.sales_user_id;

    if (!canSeeAll && !isOwn && !isUnassigned) return forbidden();

    const priorStatus = existingLead.status as string | undefined;
    const validated = result.data;
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.email !== undefined) updateData.email = validated.email;
    if (validated.phone !== undefined) updateData.phone = validated.phone;
    if (validated.company !== undefined) updateData.company = validated.company;
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.value !== undefined) updateData.value = validated.value;
    if (validated.source !== undefined) updateData.source = validated.source;
    if (validated.notes !== undefined) updateData.notes = validated.notes;
    if (validated.callback_at !== undefined)
      updateData.callback_at = validated.callback_at;

    let updateQuery = supabase.from("leads").update(updateData).eq("id", id);
    if (isUnassigned && salesUser.role === "salesperson") {
      updateData.sales_user_id = salesUser.id;
      updateQuery = supabase
        .from("leads")
        .update(updateData)
        .eq("id", id)
        .is("sales_user_id", null);
    }

    const { data, error: dbError } = await updateQuery.select().maybeSingle();

    if (!dbError && !data && isUnassigned && salesUser.role === "salesperson") {
      delete updateData.sales_user_id;
      const retry = await supabase
        .from("leads")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      if (retry.error) {
        logger.error("Failed to update lead after claim race", {
          error: retry.error.message,
          id,
        });
        return error("Failed to update lead");
      }
      maybeFireLostHook(id, validated.status, priorStatus);
      return success(retry.data);
    }

    if (dbError) {
      logger.error("Failed to update lead", {
        error: dbError.message,
        userId: salesUser.id,
        resourceId: id,
      });
      return error("Failed to update lead");
    }

    revalidatePath("/sales/leads");
    revalidatePath("/sales");

    maybeFireLostHook(id, validated.status, priorStatus);

    return success(data);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    return error("Internal server error");
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { salesUser } = await requireSalesAuth();
    const { id } = await params;

    const idResult = idParamSchema.safeParse({ id });
    if (!idResult.success) return validationError(idResult.error);

    const supabase = createAdminClient();

    const { data: existingLead, error: fetchError } = await supabase
      .from("leads")
      .select("sales_user_id")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") return notFound("Lead");
      return error("Failed to fetch lead");
    }

    const canSeeAll =
      salesUser.role === "supervisor" || salesUser.role === "admin";
    if (!canSeeAll && existingLead.sales_user_id !== salesUser.id)
      return forbidden();

    const { error: dbError } = await supabase
      .from("leads")
      .delete()
      .eq("id", id);

    if (dbError) {
      return error("Failed to delete lead");
    }

    revalidatePath("/sales/leads");
    revalidatePath("/sales");

    return success({ message: "Lead deleted successfully" });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    return error("Internal server error");
  }
}

// Fire-and-forget: when a lead transitions to 'lost', tear down any active
// demo for it (frees Vercel project + seeded org rows).
function maybeFireLostHook(
  id: string,
  newStatus: string | undefined,
  priorStatus: string | undefined,
) {
  if (newStatus === "lost" && priorStatus !== "lost") {
    teardownDemosForLead(id)
      .then((r) =>
        logger.info("Demos torn down on lead lost", {
          id,
          torn_down: r.torn_down,
        }),
      )
      .catch((err) =>
        logger.error("teardownDemosForLead failed", {
          id,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
  }
}

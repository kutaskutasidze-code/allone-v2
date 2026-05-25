import { supabase } from "./client.js";
import type { ReferenceTemplate, Segment } from "../types/demo.js";

export async function listReferences(filter: {
  segment?: Segment;
  active_only?: boolean;
}): Promise<ReferenceTemplate[]> {
  let q = supabase.from("reference_templates").select("*");
  if (filter.segment) q = q.eq("segment", filter.segment);
  if (filter.active_only !== false) q = q.eq("is_active", true);
  q = q
    .order("aesthetic_tier", { ascending: false })
    .order("last_refreshed_at", {
      ascending: false,
      nullsFirst: false,
    });
  const { data, error } = await q;
  if (error) throw error;
  return (data as ReferenceTemplate[]) ?? [];
}

export async function getReference(
  id: string,
): Promise<ReferenceTemplate | null> {
  const { data, error } = await supabase
    .from("reference_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as ReferenceTemplate | null) ?? null;
}

export async function createReference(input: {
  segment: Segment;
  source_url: string;
  source_label?: string | null;
  pre_cloned_path: string;
  aesthetic_tier?: number;
  ref_map_path?: string | null;
}): Promise<ReferenceTemplate> {
  const { data, error } = await supabase
    .from("reference_templates")
    .insert({
      segment: input.segment,
      source_url: input.source_url,
      source_label: input.source_label ?? null,
      pre_cloned_path: input.pre_cloned_path,
      aesthetic_tier: input.aesthetic_tier ?? 3,
      ref_map_path: input.ref_map_path ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ReferenceTemplate;
}

export async function setReferenceRefreshed(
  id: string,
  pre_cloned_path: string,
  xfly_check_score: number | null,
): Promise<void> {
  const { error } = await supabase
    .from("reference_templates")
    .update({
      pre_cloned_path,
      xfly_check_score,
      last_refreshed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function setReferenceActive(
  id: string,
  is_active: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("reference_templates")
    .update({ is_active })
    .eq("id", id);
  if (error) throw error;
}

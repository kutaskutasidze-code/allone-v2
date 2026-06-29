import { createAdminClient } from "@/lib/supabase/admin";
import type { Vacancy, Candidate } from "./types";

export async function getOpenVacancies(): Promise<Vacancy[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("vacancies")
    .select("id,slug,title,department,description_md,is_open")
    .eq("is_open", true);
  if (error) throw new Error(`getOpenVacancies: ${error.message}`);
  return (data ?? []) as Vacancy[];
}

export function matchVacancy(
  candidate: Candidate,
  vacancies: Vacancy[],
): Vacancy | null {
  if (candidate.vacancyId) {
    return vacancies.find((v) => v.id === candidate.vacancyId) ?? null;
  }
  return vacancies.length === 1 ? vacancies[0] : null;
}

import { createAdminClient } from "@/lib/supabase/admin";
import { feedbackConfig } from "./config";

// Lockout for the client email/password login path (magic link is not throttled).
export interface LockRow {
  failed_attempts: number;
  locked_until: string | null;
}

export function lockState(row: LockRow): { locked: boolean; minutes: number } {
  if (!row.locked_until) return { locked: false, minutes: 0 };
  const until = new Date(row.locked_until).getTime();
  const now = Date.now();
  if (until <= now) return { locked: false, minutes: 0 };
  return { locked: true, minutes: Math.max(1, Math.ceil((until - now) / 60000)) };
}

export async function registerFailure(
  id: string,
  current: LockRow,
): Promise<{ locked: boolean; minutes: number }> {
  const supabase = createAdminClient();
  const attempts = (current.failed_attempts ?? 0) + 1;

  if (attempts >= feedbackConfig.lockoutMax) {
    const lockedUntil = new Date(Date.now() + feedbackConfig.lockoutMinutes * 60000).toISOString();
    await supabase
      .from("feedback_companies")
      .update({ failed_attempts: 0, locked_until: lockedUntil })
      .eq("id", id);
    return { locked: true, minutes: feedbackConfig.lockoutMinutes };
  }

  await supabase.from("feedback_companies").update({ failed_attempts: attempts }).eq("id", id);
  return { locked: false, minutes: 0 };
}

export async function registerSuccess(id: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from("feedback_companies")
    .update({ failed_attempts: 0, locked_until: null })
    .eq("id", id);
}

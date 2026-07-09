import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "screenshots";
export const MAX_SCREENSHOTS = 3;

// Best-effort upload of up to 3 screenshots to Supabase Storage. Individual
// failures are skipped (never fatal to a submission). Returns public URLs.
export async function uploadScreenshots(companySlug: string, files: File[]): Promise<string[]> {
  const supabase = createAdminClient();
  const urls: string[] = [];

  for (const f of files.slice(0, MAX_SCREENSHOTS)) {
    if (!f || typeof f.arrayBuffer !== "function" || f.size === 0) continue;
    try {
      const buf = Buffer.from(await f.arrayBuffer());
      const ext = f.type === "image/png" ? "png" : f.type === "image/webp" ? "webp" : "jpg";
      const path = `${companySlug}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, buf, { contentType: f.type || "image/jpeg", upsert: false });
      if (error) continue;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      if (data?.publicUrl) urls.push(data.publicUrl);
    } catch {
      // skip this file
    }
  }
  return urls;
}

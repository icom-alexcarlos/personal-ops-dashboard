import { createHash, randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// 48 random bytes -> 64 chars base64url, prefixed for identifiability.
export function generateToken() {
  return `cap_${randomBytes(48).toString("base64url")}`;
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export type TokenValidation =
  | { ok: true }
  | { ok: false; reason: "invalid" | "rate_limited" };

export async function validateCaptureToken(token: string): Promise<TokenValidation> {
  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("capture_tokens")
    .select("*")
    .eq("token_hash", hashToken(token))
    .is("revoked_at", null)
    .maybeSingle();

  if (!row) return { ok: false, reason: "invalid" };

  const now = new Date();
  const windowStart = row.usage_window_start ? new Date(row.usage_window_start) : null;
  const windowExpired = !windowStart || now.getTime() - windowStart.getTime() > 60 * 60 * 1000;
  const usage = windowExpired ? 0 : row.usage_in_window;

  if (usage >= row.rate_limit_per_hour) return { ok: false, reason: "rate_limited" };

  await supabase
    .from("capture_tokens")
    .update({
      usage_window_start: windowExpired ? now.toISOString() : row.usage_window_start,
      usage_in_window: usage + 1,
      last_used_at: now.toISOString(),
    })
    .eq("id", row.id);

  return { ok: true };
}

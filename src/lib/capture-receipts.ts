import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

// Fingerprint covers the mode as well as the text: the same draft sent once to
// be parsed and once to be journalled is two different intents.
export function contentHash(text: string, mode: string) {
  return createHash("sha256").update(`${mode}\n${text}`).digest("hex");
}

export type Receipt = Record<string, unknown>;

export async function findReceipt(
  supabase: SupabaseClient,
  source: string,
  externalId: string,
  hash: string,
): Promise<Receipt | null> {
  const { data } = await supabase
    .from("capture_receipts")
    .select("response")
    .eq("source", source)
    .eq("external_id", externalId)
    .eq("content_hash", hash)
    .maybeSingle();
  return (data?.response as Receipt) ?? null;
}

export async function saveReceipt(
  supabase: SupabaseClient,
  source: string,
  externalId: string,
  hash: string,
  response: Receipt,
) {
  // Best-effort: a duplicate here means a concurrent send already recorded it,
  // which is exactly the outcome we want anyway.
  await supabase
    .from("capture_receipts")
    .insert({ source, external_id: externalId, content_hash: hash, response });
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateToken, hashToken } from "@/lib/capture-tokens";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return supabase;
}

export async function createCaptureToken(label: string, deviceName: string) {
  const supabase = await requireUser();

  const token = generateToken();
  const { error } = await supabase.from("capture_tokens").insert({
    token_hash: hashToken(token),
    label: label || "Mobile capture",
    device_name: deviceName || null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  // Plaintext goes back to the client exactly once; only the hash is stored.
  return { token };
}

export async function revokeCaptureToken(id: string) {
  const supabase = await requireUser();
  const { error } = await supabase
    .from("capture_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

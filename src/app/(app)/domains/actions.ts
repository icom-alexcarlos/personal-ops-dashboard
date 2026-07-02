"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createDomain(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const expected_cadence = String(formData.get("expected_cadence") ?? "").trim();

  if (!name) return;

  const supabase = await createClient();
  await supabase.from("stewardship_domains").insert({
    name,
    description: description || null,
    expected_cadence: expected_cadence || null,
  });

  revalidatePath("/domains");
}

export async function updateDomain(formData: FormData) {
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const expected_cadence = String(formData.get("expected_cadence") ?? "").trim();

  if (!id || !name) return;

  const supabase = await createClient();
  await supabase
    .from("stewardship_domains")
    .update({
      name,
      description: description || null,
      expected_cadence: expected_cadence || null,
    })
    .eq("id", id);

  revalidatePath("/domains");
}

export async function toggleDomainActive(formData: FormData) {
  const id = String(formData.get("id"));
  const active = formData.get("active") === "true";

  const supabase = await createClient();
  await supabase.from("stewardship_domains").update({ active: !active }).eq("id", id);

  revalidatePath("/domains");
}

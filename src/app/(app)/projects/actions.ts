"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const domain_id = String(formData.get("domain_id") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const type = String(formData.get("type") ?? "target_date");
  const target_date = String(formData.get("target_date") ?? "");

  if (!name || !domain_id) return;

  const supabase = await createClient();
  await supabase.from("projects").insert({
    name,
    domain_id,
    description: description || null,
    type,
    target_date: target_date || null,
  });

  revalidatePath("/projects");
}

export async function updateProject(formData: FormData) {
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "active");
  const target_date = String(formData.get("target_date") ?? "");

  if (!id || !name) return;

  const supabase = await createClient();
  await supabase
    .from("projects")
    .update({
      name,
      description: description || null,
      status,
      target_date: target_date || null,
      completed_at: status === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
}

export async function createMilestone(formData: FormData) {
  const project_id = String(formData.get("project_id"));
  const title = String(formData.get("title") ?? "").trim();
  const weight = Number(formData.get("weight") ?? 1);

  if (!project_id || !title) return;

  const supabase = await createClient();
  await supabase.from("milestones").insert({ project_id, title, weight });

  revalidatePath(`/projects/${project_id}`);
}

export async function updateMilestoneStatus(formData: FormData) {
  const id = String(formData.get("id"));
  const project_id = String(formData.get("project_id"));
  const status = String(formData.get("status"));

  const supabase = await createClient();
  await supabase
    .from("milestones")
    .update({
      status,
      completed_at: status === "done" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  revalidatePath(`/projects/${project_id}`);
}

export async function deleteProject(formData: FormData) {
  const id = String(formData.get("id"));

  const supabase = await createClient();
  await supabase.from("projects").delete().eq("id", id);

  revalidatePath("/projects");
  redirect("/projects");
}

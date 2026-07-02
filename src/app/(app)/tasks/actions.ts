"use server";

import { revalidatePath } from "next/cache";
import { rrulestr } from "rrule";
import { createClient } from "@/lib/supabase/server";

async function getInboxDomainId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase
    .from("stewardship_domains")
    .select("id")
    .eq("is_system", true)
    .single();
  return data?.id as string;
}

function parseReminderOffsets(formData: FormData): number[] {
  return formData
    .getAll("reminder_offsets")
    .map((v) => Number(v))
    .filter((v) => !Number.isNaN(v));
}

export async function createTask(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  let domain_id = String(formData.get("domain_id") ?? "");
  const project_id = String(formData.get("project_id") ?? "") || null;
  const parent_task_id = String(formData.get("parent_task_id") ?? "") || null;
  const due_date = String(formData.get("due_date") ?? "") || null;
  const due_time = String(formData.get("due_time") ?? "") || null;
  const priority = String(formData.get("priority") ?? "") || null;
  const recurrence_rule = String(formData.get("recurrence_rule") ?? "") || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const reminder_offsets = parseReminderOffsets(formData);

  const supabase = await createClient();
  if (!domain_id) domain_id = await getInboxDomainId(supabase);

  await supabase.from("tasks").insert({
    title,
    domain_id,
    project_id,
    parent_task_id,
    due_date,
    due_time,
    priority,
    recurrence_rule,
    notes,
    reminder_offsets,
    source: "manual",
  });

  revalidatePath("/tasks");
}

export async function completeTask(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();

  const { data: task } = await supabase.from("tasks").select("*").eq("id", id).single();
  if (!task) return;

  await supabase
    .from("tasks")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", id);

  // Recurring task: spawn the next occurrence.
  if (task.recurrence_rule && task.due_date) {
    try {
      const rule = rrulestr(
        `DTSTART:${task.due_date.replace(/-/g, "")}T000000Z\nRRULE:${task.recurrence_rule}`,
      );
      const [, next] = rule.all((_date, i) => i < 2);
      if (next) {
        const nextDate = next.toISOString().slice(0, 10);
        await supabase.from("tasks").insert({
          title: task.title,
          notes: task.notes,
          domain_id: task.domain_id,
          project_id: task.project_id,
          parent_task_id: task.parent_task_id,
          due_date: nextDate,
          due_time: task.due_time,
          priority: task.priority,
          recurrence_rule: task.recurrence_rule,
          reminder_offsets: task.reminder_offsets,
          source: task.source,
        });
      }
    } catch {
      // Malformed recurrence rule -- skip spawning rather than fail the completion.
    }
  }

  revalidatePath("/tasks");
}

export async function uncompleteTask(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("tasks").update({ status: "open", completed_at: null }).eq("id", id);
  revalidatePath("/tasks");
}

export async function deleteTask(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", id);
  revalidatePath("/tasks");
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markRead(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("notifications").update({ status: "read" }).eq("id", id);
  revalidatePath("/notifications");
}

export async function dismiss(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("notifications").update({ status: "dismissed" }).eq("id", id);
  revalidatePath("/notifications");
}

export async function undoAction(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();

  const { data: notification } = await supabase
    .from("notifications")
    .select("undo_payload")
    .eq("id", id)
    .single();

  const undo = notification?.undo_payload as { type: string; id?: string; status?: string } | null;

  if (undo?.id) {
    switch (undo.type) {
      case "delete_task":
        await supabase.from("tasks").delete().eq("id", undo.id);
        break;
      case "reopen_task":
        await supabase.from("tasks").update({ status: "open", completed_at: null }).eq("id", undo.id);
        break;
      case "delete_project":
        await supabase.from("projects").delete().eq("id", undo.id);
        break;
      case "set_project_status":
        await supabase
          .from("projects")
          .update({ status: undo.status, completed_at: null })
          .eq("id", undo.id);
        break;
      case "delete_activity_log":
        await supabase.from("activity_log").delete().eq("id", undo.id);
        break;
      case "set_milestone_status":
        await supabase
          .from("milestones")
          .update({ status: undo.status, completed_at: null })
          .eq("id", undo.id);
        break;
      case "delete_calendar_event":
        await supabase.from("calendar_events").delete().eq("id", undo.id);
        break;
    }
  }

  await supabase.from("notifications").update({ status: "dismissed" }).eq("id", id);
  revalidatePath("/notifications");
  revalidatePath("/tasks");
  revalidatePath("/projects");
  revalidatePath("/today");
}

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  updateProject,
  createMilestone,
  updateMilestoneStatus,
  deleteProject,
} from "../actions";
import { MilestoneStatusSelect } from "./milestone-status-select";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: project }, { data: milestones }] = await Promise.all([
    supabase.from("projects").select("*, stewardship_domains(name)").eq("id", id).single(),
    supabase
      .from("milestones")
      .select("*")
      .eq("project_id", id)
      .order("created_at"),
  ]);

  if (!project) notFound();

  return (
    <div className="p-6">
      <p className="text-sm text-zinc-500">{project.stewardship_domains?.name}</p>

      <form action={updateProject} className="mt-2 space-y-2">
        <input type="hidden" name="id" value={project.id} />
        <input
          name="name"
          defaultValue={project.name}
          className="w-full rounded border px-2 py-1 text-lg font-semibold"
        />
        <textarea
          name="description"
          defaultValue={project.description ?? ""}
          rows={2}
          placeholder="Description"
          className="w-full rounded border px-2 py-1 text-sm"
        />
        <div className="flex gap-2">
          <select name="status" defaultValue={project.status} className="rounded border px-2 py-1 text-sm">
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input
            type="date"
            name="target_date"
            defaultValue={project.target_date ?? ""}
            className="rounded border px-2 py-1 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="rounded bg-black px-3 py-1 text-sm text-white">
            Save
          </button>
        </div>
      </form>

      <form action={deleteProject} className="mt-2">
        <input type="hidden" name="id" value={project.id} />
        <button type="submit" className="text-sm text-red-600 underline">
          Delete project
        </button>
      </form>

      <h2 className="mt-8 font-medium">Milestones</h2>
      <div className="mt-2 space-y-2">
        {milestones?.map((m) => (
          <form
            key={m.id}
            action={updateMilestoneStatus}
            className="flex items-center justify-between rounded border p-3"
          >
            <input type="hidden" name="id" value={m.id} />
            <input type="hidden" name="project_id" value={project.id} />
            <span className={m.status === "done" ? "line-through text-zinc-400" : ""}>
              {m.title}
            </span>
            <MilestoneStatusSelect status={m.status} />
          </form>
        ))}
        {milestones?.length === 0 && (
          <p className="text-sm text-zinc-500">No milestones yet.</p>
        )}
      </div>

      <form action={createMilestone} className="mt-4 flex gap-2">
        <input type="hidden" name="project_id" value={project.id} />
        <input
          name="title"
          placeholder="New milestone"
          required
          className="flex-1 rounded border px-2 py-1 text-sm"
        />
        <button type="submit" className="rounded border px-3 py-1 text-sm">
          Add
        </button>
      </form>
    </div>
  );
}

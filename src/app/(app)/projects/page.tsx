import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createProject } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default async function ProjectsPage() {
  const supabase = await createClient();

  const [{ data: projects }, { data: domains }] = await Promise.all([
    supabase
      .from("projects")
      .select("*, stewardship_domains(name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("stewardship_domains")
      .select("id, name")
      .eq("active", true)
      .order("name"),
  ]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Projects</h1>

      <div className="mt-6 space-y-3">
        {projects?.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="block rounded border p-4"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{project.name}</span>
              <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                {STATUS_LABEL[project.status] ?? project.status}
              </span>
            </div>
            <div className="mt-1 text-sm text-zinc-500">
              {project.stewardship_domains?.name}
              {project.target_date ? ` · due ${project.target_date}` : ""}
            </div>
          </Link>
        ))}
        {projects?.length === 0 && (
          <p className="text-sm text-zinc-500">No projects yet.</p>
        )}
      </div>

      <form action={createProject} className="mt-8 rounded border border-dashed p-4">
        <h2 className="font-medium">New project</h2>
        <input
          name="name"
          placeholder="Name"
          required
          className="mt-2 w-full rounded border px-2 py-1"
        />
        <select name="domain_id" required className="mt-2 w-full rounded border px-2 py-1">
          <option value="">Select domain</option>
          {domains?.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <textarea
          name="description"
          placeholder="Description"
          rows={2}
          className="mt-2 w-full rounded border px-2 py-1 text-sm"
        />
        <div className="mt-2 flex gap-2">
          <select name="type" className="flex-1 rounded border px-2 py-1 text-sm">
            <option value="target_date">Target date</option>
            <option value="retainer">Retainer</option>
          </select>
          <input
            type="date"
            name="target_date"
            className="flex-1 rounded border px-2 py-1 text-sm"
          />
        </div>
        <button
          type="submit"
          className="mt-3 rounded bg-black px-3 py-1 text-sm text-white"
        >
          Add project
        </button>
      </form>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { createTask, completeTask, uncompleteTask, deleteTask } from "./actions";

const RECURRENCE_PRESETS: Record<string, string> = {
  "": "",
  daily: "FREQ=DAILY",
  weekdays: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
  weekly: "FREQ=WEEKLY",
  monthly: "FREQ=MONTHLY",
};

const REMINDER_OPTIONS = [
  { minutes: 0, label: "At due time" },
  { minutes: 15, label: "15 min before" },
  { minutes: 60, label: "1 hour before" },
  { minutes: 1440, label: "1 day before" },
];

export default async function TasksPage() {
  const supabase = await createClient();

  const [{ data: domains }, { data: projects }, { data: openTasks }, { data: completedTasks }] =
    await Promise.all([
      supabase.from("stewardship_domains").select("id, name").eq("active", true).order("name"),
      supabase.from("projects").select("id, name").eq("status", "active").order("name"),
      supabase
        .from("tasks")
        .select("*, stewardship_domains(name), projects(name)")
        .eq("status", "open")
        .order("due_date", { ascending: true, nullsFirst: false }),
      supabase
        .from("tasks")
        .select("*, stewardship_domains(name)")
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(10),
    ]);

  const topLevel = openTasks?.filter((t) => !t.parent_task_id) ?? [];
  const subtasksByParent = new Map<string, typeof openTasks>();
  for (const t of openTasks ?? []) {
    if (t.parent_task_id) {
      const list = subtasksByParent.get(t.parent_task_id) ?? [];
      list.push(t);
      subtasksByParent.set(t.parent_task_id, list);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Tasks</h1>

      <div className="mt-6 space-y-2">
        {topLevel.map((task) => (
          <div key={task.id}>
            <TaskRow task={task} />
            {subtasksByParent.get(task.id)?.map((sub) => (
              <div key={sub.id} className="ml-6">
                <TaskRow task={sub} />
              </div>
            ))}
          </div>
        ))}
        {topLevel.length === 0 && <p className="text-sm text-zinc-500">No open tasks.</p>}
      </div>

      {completedTasks && completedTasks.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm text-zinc-500">
            Recently completed ({completedTasks.length})
          </summary>
          <div className="mt-2 space-y-1">
            {completedTasks.map((task) => (
              <form key={task.id} action={uncompleteTask} className="flex items-center gap-2 text-sm text-zinc-400">
                <input type="hidden" name="id" value={task.id} />
                <span className="line-through">{task.title}</span>
                <button type="submit" className="underline">
                  undo
                </button>
              </form>
            ))}
          </div>
        </details>
      )}

      <form action={createTask} className="mt-8 space-y-2 rounded border border-dashed p-4">
        <h2 className="font-medium">New task</h2>
        <input
          name="title"
          placeholder="Title"
          required
          className="w-full rounded border px-2 py-1"
        />
        <textarea
          name="notes"
          placeholder="Notes"
          rows={2}
          className="w-full rounded border px-2 py-1 text-sm"
        />

        <div className="flex gap-2">
          <select name="domain_id" className="flex-1 rounded border px-2 py-1 text-sm">
            <option value="">Inbox (default)</option>
            {domains?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select name="project_id" className="flex-1 rounded border px-2 py-1 text-sm">
            <option value="">No project</option>
            {projects?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <input type="date" name="due_date" className="flex-1 rounded border px-2 py-1 text-sm" />
          <input type="time" name="due_time" className="flex-1 rounded border px-2 py-1 text-sm" />
          <select name="priority" className="flex-1 rounded border px-2 py-1 text-sm">
            <option value="">No priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <select name="recurrence_rule" className="w-full rounded border px-2 py-1 text-sm">
          {Object.entries(RECURRENCE_PRESETS).map(([key, rule]) => (
            <option key={key} value={rule}>
              {key === "" ? "Does not repeat" : key[0].toUpperCase() + key.slice(1)}
            </option>
          ))}
        </select>

        <div className="flex flex-wrap gap-3 text-sm">
          {REMINDER_OPTIONS.map((opt) => (
            <label key={opt.minutes} className="flex items-center gap-1">
              <input type="checkbox" name="reminder_offsets" value={opt.minutes} />
              {opt.label}
            </label>
          ))}
        </div>

        <button type="submit" className="rounded bg-black px-3 py-1 text-sm text-white">
          Add task
        </button>
      </form>
    </div>
  );
}

function TaskRow({
  task,
}: {
  task: {
    id: string;
    title: string;
    due_date: string | null;
    due_time: string | null;
    priority: string | null;
    recurrence_rule: string | null;
    domain_id: string;
    project_id: string | null;
    stewardship_domains?: { name: string } | null;
    projects?: { name: string } | null;
  };
}) {
  return (
    <div className="rounded border p-3">
      <div className="flex items-center gap-3">
        <form action={completeTask}>
          <input type="hidden" name="id" value={task.id} />
          <button
            type="submit"
            aria-label="Complete task"
            className="h-5 w-5 rounded-full border"
          />
        </form>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span>{task.title}</span>
            {task.recurrence_rule && <span title="Repeats">🔁</span>}
            {task.priority && (
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600">
                {task.priority}
              </span>
            )}
          </div>
          <div className="text-xs text-zinc-500">
            {task.stewardship_domains?.name}
            {task.projects?.name ? ` · ${task.projects.name}` : ""}
            {task.due_date ? ` · due ${task.due_date}${task.due_time ? ` ${task.due_time}` : ""}` : ""}
          </div>
        </div>

        <form action={deleteTask}>
          <input type="hidden" name="id" value={task.id} />
          <button type="submit" className="text-xs text-red-500 underline">
            delete
          </button>
        </form>
      </div>

      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-zinc-500">+ subtask</summary>
        <form action={createTask} className="mt-2 flex gap-2">
          <input type="hidden" name="parent_task_id" value={task.id} />
          <input type="hidden" name="domain_id" value={task.domain_id} />
          {task.project_id && (
            <input type="hidden" name="project_id" value={task.project_id} />
          )}
          <input
            name="title"
            placeholder="Subtask title"
            required
            className="flex-1 rounded border px-2 py-1 text-sm"
          />
          <button type="submit" className="rounded border px-3 py-1 text-sm">
            Add
          </button>
        </form>
      </details>
    </div>
  );
}

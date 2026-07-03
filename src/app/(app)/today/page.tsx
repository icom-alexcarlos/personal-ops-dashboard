import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";
import { CalendarSyncButton } from "./calendar-sync-button";
import { completeTask } from "../tasks/actions";
import { isCalendarConnected } from "@/lib/google-calendar";

const MAX_TOP_TASKS = 8;

function localISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = new Date();
  const todayStr = localISODate(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = localISODate(tomorrow);

  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const [{ data: domains }, { data: dueTasks }, { data: events }, { data: journalEntries }] = await Promise.all([
    supabase.from("stewardship_domains").select("id, name").eq("active", true).order("name"),
    supabase
      .from("tasks")
      .select("*, stewardship_domains(name)")
      .eq("status", "open")
      .lte("due_date", todayStr)
      .order("due_date", { ascending: true })
      .order("priority", { ascending: true }),
    supabase
      .from("calendar_events")
      .select("*")
      .gte("starts_at", `${todayStr}T00:00:00`)
      .lt("starts_at", `${tomorrowStr}T00:00:00`)
      .order("starts_at"),
    supabase
      .from("journal_entries")
      .select("entry_date, transcription_text")
      .eq("source", "obsidian")
      .gte("entry_date", localISODate(threeDaysAgo))
      .order("entry_date", { ascending: false })
      .limit(1),
  ]);

  const latestJournal = journalEntries?.[0] ?? null;

  // Domain status: open + overdue task counts, computed here rather than a
  // separate observations engine (that's a Phase 4 module).
  const { data: openTasksForCounts } = await supabase
    .from("tasks")
    .select("domain_id, due_date")
    .eq("status", "open");

  const domainStats = new Map<string, { open: number; overdue: number }>();
  for (const t of openTasksForCounts ?? []) {
    const stat = domainStats.get(t.domain_id) ?? { open: 0, overdue: 0 };
    stat.open += 1;
    if (t.due_date && t.due_date < todayStr) stat.overdue += 1;
    domainStats.set(t.domain_id, stat);
  }

  const topTasks = (dueTasks ?? []).slice(0, MAX_TOP_TASKS);
  const overflowCount = (dueTasks?.length ?? 0) - topTasks.length;
  const calendarConnected = await isCalendarConnected();
  const { count: unreadCountRaw } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("status", "unread");
  const unreadCount = unreadCountRaw ?? 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Today</h1>
          <p className="text-sm text-zinc-500">
            {now.toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/notifications" className="relative text-sm text-zinc-500 underline">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">
                {unreadCount}
              </span>
            )}
          </Link>
          <Link href="/settings" className="text-sm text-zinc-500 underline">
            Settings
          </Link>
          <SignOutButton />
        </div>
      </div>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-500">Calendar</h2>
          <CalendarSyncButton connected={calendarConnected} />
        </div>
        <div className="mt-2 space-y-2">
          {events?.map((e) => (
            <div key={e.id} className="rounded border p-3 text-sm">
              <span className="font-medium">{e.title}</span>{" "}
              <span className="text-zinc-500">
                {new Date(e.starts_at).toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}
          {events?.length === 0 && (
            <p className="text-sm text-zinc-400">
              {calendarConnected
                ? "No events today."
                : "No events synced yet. Connect Google Calendar to see them here."}
            </p>
          )}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-zinc-500">Top tasks</h2>
        <div className="mt-2 space-y-2">
          {topTasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3 rounded border p-3">
              <form action={completeTask}>
                <input type="hidden" name="id" value={task.id} />
                <button
                  type="submit"
                  aria-label="Complete task"
                  className="h-5 w-5 rounded-full border"
                />
              </form>
              <div className="flex-1">
                <span>{task.title}</span>
                <div className="text-xs text-zinc-500">
                  {task.stewardship_domains?.name}
                  {task.due_date && task.due_date < todayStr ? " · overdue" : ""}
                </div>
              </div>
              {task.priority && (
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600">
                  {task.priority}
                </span>
              )}
            </div>
          ))}
          {topTasks.length === 0 && (
            <p className="text-sm text-zinc-400">Nothing due today. Nice.</p>
          )}
          {overflowCount > 0 && (
            <Link href="/tasks" className="block text-sm text-zinc-500 underline">
              +{overflowCount} more due — view all tasks
            </Link>
          )}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-zinc-500">Domains</h2>
        <div className="mt-2 space-y-2">
          {domains?.map((d) => {
            const stat = domainStats.get(d.id) ?? { open: 0, overdue: 0 };
            return (
              <div
                key={d.id}
                className="flex items-center justify-between rounded border p-3 text-sm"
              >
                <span className="flex items-center gap-2">
                  {stat.overdue > 0 && (
                    <span className="h-2 w-2 rounded-full bg-red-500" title="Has overdue tasks" />
                  )}
                  {d.name}
                </span>
                <span className="text-zinc-500">
                  {stat.open} open{stat.overdue > 0 ? ` · ${stat.overdue} overdue` : ""}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {latestJournal && (
        <section className="mt-6">
          <h2 className="text-sm font-medium text-zinc-500">Daily log</h2>
          <details className="mt-2 rounded border p-3 text-sm">
            <summary className="cursor-pointer font-medium">
              {new Date(`${latestJournal.entry_date}T12:00:00`).toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
              <span className="ml-2 text-xs font-normal text-zinc-400">from Obsidian</span>
            </summary>
            <pre className="mt-3 max-h-96 overflow-y-auto whitespace-pre-wrap font-sans text-xs text-zinc-600">
              {latestJournal.transcription_text}
            </pre>
          </details>
        </section>
      )}

      <p className="mt-8 text-xs text-zinc-400">Signed in as {user?.email}</p>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { markRead, dismiss, undoAction } from "./actions";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .neq("status", "dismissed")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Notifications</h1>
      <p className="mt-1 text-sm text-zinc-500">System actions taken on your behalf.</p>

      <div className="mt-6 space-y-2">
        {notifications?.map((n) => (
          <div
            key={n.id}
            className={`rounded border p-3 ${n.status === "unread" ? "bg-zinc-50" : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{n.title}</p>
                {n.body && <p className="mt-0.5 text-xs text-zinc-500">{n.body}</p>}
                <p className="mt-1 text-xs text-zinc-400">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {n.status === "unread" && (
                  <form action={markRead}>
                    <input type="hidden" name="id" value={n.id} />
                    <button type="submit" className="text-xs text-zinc-500 underline">
                      mark read
                    </button>
                  </form>
                )}
                {n.undo_payload && (
                  <form action={undoAction}>
                    <input type="hidden" name="id" value={n.id} />
                    <button type="submit" className="text-xs text-red-600 underline">
                      undo
                    </button>
                  </form>
                )}
                <form action={dismiss}>
                  <input type="hidden" name="id" value={n.id} />
                  <button type="submit" className="text-xs text-zinc-400 underline">
                    dismiss
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}
        {notifications?.length === 0 && (
          <p className="text-sm text-zinc-500">No notifications yet.</p>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CalendarSyncButton({ connected }: { connected: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!connected) {
    return (
      <a href="/api/auth/google" className="text-xs text-zinc-500 underline">
        Connect Google Calendar
      </a>
    );
  }

  async function handleSync() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/calendar/sync", { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Sync failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={handleSync} disabled={loading} className="text-xs text-zinc-500 underline">
        {loading ? "Syncing..." : "Sync now"}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

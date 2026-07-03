import { createClient } from "@/lib/supabase/server";
import { TokenManager } from "./token-manager";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: tokens } = await supabase
    .from("capture_tokens")
    .select("id, label, device_name, last_used_at, revoked_at, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-zinc-500">Mobile capture tokens</h2>
        <p className="mt-1 text-xs text-zinc-400">
          Tokens let phone shortcuts post captures without logging in. Scoped to
          /api/capture only — they can&apos;t read or modify anything else.
        </p>
        <div className="mt-3">
          <TokenManager tokens={tokens ?? []} />
        </div>
      </section>
    </div>
  );
}

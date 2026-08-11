import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DRAFTS_ACTION_SCRIPT } from "@/lib/drafts-action";
import { TokenManager } from "./token-manager";
import { DraftsSetup } from "./drafts-setup";

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: tokens } = await supabase
    .from("capture_tokens")
    .select("id, label, device_name, last_used_at, revoked_at, created_at")
    .order("created_at", { ascending: false });

  const baseUrl = await getBaseUrl();

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

      <section className="mt-10">
        <h2 className="text-sm font-medium text-zinc-500">Drafts</h2>
        <p className="mt-1 text-xs text-zinc-400">
          Send a draft to the dashboard from iOS, iPadOS, or the Mac. Uses the same capture
          token as the phone shortcuts.
        </p>
        <div className="mt-3">
          <DraftsSetup baseUrl={baseUrl} script={DRAFTS_ACTION_SCRIPT} />
        </div>
      </section>
    </div>
  );
}

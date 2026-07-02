import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Privileged client for server-only code (cron jobs, background sync).
// Bypasses Row Level Security -- never import this into client components.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

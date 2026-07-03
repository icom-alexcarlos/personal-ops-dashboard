-- Bearer tokens for mobile shortcuts (Phase 2). Only the SHA-256 hash is
-- stored; the plaintext token is shown once at creation and never again.
create table capture_tokens (
  id uuid primary key default gen_random_uuid(),
  token_hash text unique not null,
  label text not null,
  device_name text,
  scopes jsonb not null default '["capture"]'::jsonb,
  rate_limit_per_hour integer not null default 120,
  usage_window_start timestamptz,
  usage_in_window integer not null default 0,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table capture_tokens enable row level security;

-- Token validation happens server-side via the admin client (bypasses RLS);
-- this policy is for managing tokens from the logged-in settings page.
create policy "authenticated full access" on capture_tokens for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

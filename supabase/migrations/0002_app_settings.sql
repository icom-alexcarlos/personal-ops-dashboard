-- Generic key/value store for app-level config, starting with the
-- Google Calendar OAuth token set.
create table app_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table app_settings enable row level security;

create policy "authenticated full access" on app_settings for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

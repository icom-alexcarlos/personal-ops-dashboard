-- Phase 1 core schema. Single-user app: RLS policies just gate on
-- "is there an authenticated session at all", not per-row ownership.
create extension if not exists "pgcrypto";

create table stewardship_domains (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  failure_patterns jsonb not null default '[]'::jsonb,
  expected_cadence text,
  is_system boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  domain_id uuid not null references stewardship_domains(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'cancelled')),
  kind text not null default 'project', -- 'area' retained only for historical rows; do not use for new rows
  type text not null default 'target_date' check (type in ('target_date', 'retainer')),
  target_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'done')),
  weight numeric not null default 1,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  notes text,
  status text not null default 'open' check (status in ('open', 'completed', 'cancelled')),
  due_date date,
  due_time time,
  priority text check (priority in ('low', 'medium', 'high')),
  domain_id uuid not null references stewardship_domains(id) on delete restrict,
  project_id uuid references projects(id) on delete set null,
  parent_task_id uuid references tasks(id) on delete cascade,
  recurrence_rule text,
  reminder_offsets integer[] not null default '{}',
  source text not null default 'manual' check (source in ('manual', 'voice', 'email', 'observation')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  entry text not null,
  hours_logged numeric,
  logged_at timestamptz not null default now(),
  source text not null default 'manual' check (source in ('manual', 'voice'))
);

create table calendar_events (
  id uuid primary key default gen_random_uuid(),
  google_event_id text unique,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text,
  attendees jsonb not null default '[]'::jsonb,
  synced_at timestamptz,
  source text not null default 'google' check (source in ('google', 'manual'))
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  body text,
  source_ref text,
  source_url text,
  status text not null default 'unread' check (status in ('unread', 'read', 'dismissed')),
  undo_payload jsonb,
  created_at timestamptz not null default now()
);

create table pending_captures (
  id uuid primary key default gen_random_uuid(),
  raw_transcript text not null,
  source text not null default 'in_app',
  captured_at timestamptz not null default now(),
  parsed_intent jsonb,
  candidates jsonb,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'expired')),
  resolved_at timestamptz
);

-- Seed the Inbox: default catch-all domain, referenced by app code when
-- voice capture or manual entry doesn't specify a domain.
insert into stewardship_domains (name, description, is_system, active)
values ('Inbox', 'Default landing zone for unsorted tasks', true, true);

-- Row Level Security: single-user app, gate every table on "is there a
-- logged-in session", not per-row ownership (there's only one user).
alter table stewardship_domains enable row level security;
alter table projects enable row level security;
alter table milestones enable row level security;
alter table tasks enable row level security;
alter table activity_log enable row level security;
alter table calendar_events enable row level security;
alter table notifications enable row level security;
alter table pending_captures enable row level security;

create policy "authenticated full access" on stewardship_domains for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on projects for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on milestones for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on tasks for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on activity_log for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on calendar_events for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on notifications for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on pending_captures for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

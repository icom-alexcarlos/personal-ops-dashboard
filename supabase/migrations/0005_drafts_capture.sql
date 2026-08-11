-- Drafts app integration. Drafts posts to /api/capture the same way the iOS
-- shortcut does, so this migration is only about (a) recording 'drafts' as a
-- real provenance value instead of laundering it through 'voice', and (b) a
-- receipts table so re-running an action on the same draft is a no-op.

-- Provenance: widen the source check constraints rather than reusing 'voice'.
alter table tasks drop constraint if exists tasks_source_check;
alter table tasks add constraint tasks_source_check
  check (source in ('manual', 'voice', 'email', 'observation', 'drafts'));

alter table activity_log drop constraint if exists activity_log_source_check;
alter table activity_log add constraint activity_log_source_check
  check (source in ('manual', 'voice', 'drafts'));

alter table journal_entries drop constraint if exists journal_entries_source_check;
alter table journal_entries add constraint journal_entries_source_check
  check (source in ('handwritten_photo', 'voice', 'typed', 'obsidian', 'drafts'));

-- Idempotence. Drafts keeps a draft around after an action runs, so the same
-- draft gets sent twice more often than you'd think (fat-fingered re-tap,
-- retry after a flaky connection, an action chained twice). Keyed on the
-- draft's UUID *and* a hash of what was sent: an unchanged re-send replays the
-- stored response and touches nothing, while an edited draft is new work.
create table capture_receipts (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  external_id text not null,
  content_hash text not null,
  response jsonb not null,
  created_at timestamptz not null default now(),
  unique (source, external_id, content_hash)
);

alter table capture_receipts enable row level security;

create policy "authenticated full access" on capture_receipts for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

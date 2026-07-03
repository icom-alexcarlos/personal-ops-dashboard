-- Journal entries (Phase 3 table, added early for the Obsidian daily-log
-- sync). One row per (entry_date, source) so the Obsidian sync can upsert
-- without clobbering future voice/typed entries on the same day.
create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null,
  image_path text,
  transcription_text text not null,
  source text not null check (source in ('handwritten_photo', 'voice', 'typed', 'obsidian')),
  tags text[] not null default '{}',
  extracted_facts jsonb,
  resurface_weight numeric not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entry_date, source)
);

alter table journal_entries enable row level security;

create policy "authenticated full access" on journal_entries for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

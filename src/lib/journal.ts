import type { SupabaseClient } from "@supabase/supabase-js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

// The client sends its own local date/time. The server runs in UTC on Vercel,
// so deriving "today" here would roll the daily log over mid-evening.
export function resolveEntryDate(supplied: unknown): string {
  if (typeof supplied === "string" && DATE_RE.test(supplied)) return supplied;
  return new Date().toISOString().slice(0, 10);
}

export function resolveEntryTime(supplied: unknown): string | null {
  return typeof supplied === "string" && TIME_RE.test(supplied) ? supplied : null;
}

export type JournalAppendResult = { entryDate: string; appended: boolean };

/**
 * Adds a segment to the day's journal row for `source`, creating it if this is
 * the first entry of the day. Append rather than replace: a daily log is
 * written across the day from several captures, and journal_entries is unique
 * on (entry_date, source) so there's one row to grow.
 */
export async function appendJournalSegment(
  supabase: SupabaseClient,
  {
    source,
    entryDate,
    entryTime,
    text,
    tags,
  }: {
    source: string;
    entryDate: string;
    entryTime: string | null;
    text: string;
    tags: string[];
  },
): Promise<JournalAppendResult> {
  const segment = `${entryTime ? `**${entryTime}**\n` : ""}${text.trim()}`;

  const { data: existing } = await supabase
    .from("journal_entries")
    .select("id, transcription_text, tags")
    .eq("entry_date", entryDate)
    .eq("source", source)
    .maybeSingle();

  if (existing) {
    const mergedTags = Array.from(
      new Set([...((existing.tags as string[]) ?? []), ...tags]),
    );
    await supabase
      .from("journal_entries")
      .update({
        transcription_text: `${existing.transcription_text.trim()}\n\n---\n\n${segment}`,
        tags: mergedTags,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    return { entryDate, appended: true };
  }

  await supabase.from("journal_entries").insert({
    entry_date: entryDate,
    transcription_text: segment,
    source,
    tags,
  });
  return { entryDate, appended: false };
}

#!/usr/bin/env node
// Pushes an Obsidian daily note into the dashboard's journal_entries table.
// Runs locally on the Mac (the vault is local); the nightly scheduled task
// calls this after writing the note. Usage:
//   node scripts/push-daily-note.mjs [YYYY-MM-DD]   (defaults to today)

import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const VAULT_DAILY_DIR = "/Users/alexcarlos/Documents/newob/New/Daily";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const envPath = join(projectRoot, ".env.local");
  const env = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

function localISODate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const date = process.argv[2] || localISODate();
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.error(`Invalid date: ${date}`);
  process.exit(1);
}

const notePath = join(VAULT_DAILY_DIR, `${date}.md`);
if (!existsSync(notePath)) {
  console.log(`No daily note at ${notePath} — nothing to push.`);
  process.exit(0);
}

let body = readFileSync(notePath, "utf8");
// Strip YAML frontmatter; the dashboard stores just the markdown body.
body = body.replace(/^---\n[\s\S]*?\n---\n/, "").trim();

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}

const res = await fetch(
  `${url}/rest/v1/journal_entries?on_conflict=entry_date,source`,
  {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      entry_date: date,
      transcription_text: body,
      source: "obsidian",
      tags: ["daily", "obsidian"],
      updated_at: new Date().toISOString(),
    }),
  },
);

if (!res.ok) {
  console.error(`Push failed (${res.status}): ${await res.text()}`);
  process.exit(1);
}
console.log(`Pushed ${date} daily note to journal_entries (${body.length} chars).`);

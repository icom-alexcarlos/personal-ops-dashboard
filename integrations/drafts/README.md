# Drafts → Dashboard

[Drafts](https://getdrafts.com) posts into the dashboard's existing
`POST /api/capture` endpoint, the same one the iOS shortcut uses. Nothing runs
on the Drafts side but a single action with one Script step.

The script itself lives in [`src/lib/drafts-action.ts`](../../src/lib/drafts-action.ts)
and is rendered with a copy button at **Settings → Drafts** in the running app,
so it can be copied on whichever device Drafts is being set up on.

## Setup

1. **Settings → Mobile capture tokens → Generate token.** Copy it; it is shown
   once.
2. In Drafts: **Actions → + → New Action**, name it "Capture to Dashboard".
3. Add a single **Script** step and paste in the script from Settings → Drafts.
4. Run the action once on any draft. Drafts prompts for the dashboard URL
   (e.g. `https://personal-ops-dashboard-9g6p.vercel.app`, no trailing slash)
   and the capture token, stores both in its credential keychain, and won't ask
   again.

Assign it a keyboard shortcut or put it in the action bar. On iOS it also works
from the share sheet and from the Drafts widget.

## Behaviour

| Draft | Result |
| --- | --- |
| Untagged | Parsed by Claude into tasks / projects / calendar events / activity, exactly like voice capture. The first line becomes the task title; following lines become the task's notes. |
| Tagged `journal` | Appended to that day's daily log (`journal_entries`, source `drafts`) with a `**HH:MM**` header, and surfaced on the Today screen next to the Obsidian note. |

Change `JOURNAL_TAG` at the top of the script to route on a different tag.

Confirmations come back through `spoken_confirmation` and are shown by
`app.displaySuccessMessage()` — the same string the phone shortcut speaks.

### Re-sending a draft

Drafts keeps a draft around after an action runs, so the same one gets sent
twice fairly often. Each request carries the draft's UUID plus a hash of what
was sent, recorded in `capture_receipts`:

- **Unchanged draft, sent again** — the stored response is replayed and nothing
  is written. Drafts appends "(already sent)" to the confirmation.
- **Edited draft, sent again** — a different hash, so it is treated as new
  input. For a parsed draft that means the edited version is parsed afresh; for
  a journal draft it means a second segment is appended, not a replacement.

### Dates

The script sends the device's local date and time. The server runs in UTC on
Vercel, so deriving "today" server-side would roll the daily log over in the
evening.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| Prompted for credentials again | The token was rejected (401) and the script called `credential.forget()`. Generate a new token in Settings. |
| "Rate limit exceeded" | 120 captures/hour per token by default — `capture_tokens.rate_limit_per_hour`. |
| Confirmation says "Nothing to do" | The parser found no supported action in the text. Tag it `journal` if it was meant as a log entry. |
| Everything 404s after a redeploy | The stored URL is stale. Edit the credential in Drafts under Settings → Credentials. |

---
title: "kar2phi/video-lens — YouTube transcript to research report"
type: source
medium: repository
tags: [tooling, agents, video]
url: https://github.com/kar2phi/video-lens
ingested: 2026-08-10
updated: 2026-08-10
---

# kar2phi/video-lens

[Repository](https://github.com/kar2phi/video-lens) · MIT · skill version 5.0

Read from a shallow clone on 2026-08-10 — `skills/video-lens/SKILL.md`, the six bundled
scripts, and `template.html`. Statements below are from the code, not the README's claims.

## Summary

An agent skill in the portable [SKILL.md](https://agents.md/) format that turns a YouTube
URL into a single self-contained HTML report: executive summary, one-line takeaway,
analysed key points, a timestamped outline wired to an embedded player, and the uploader's
description. No API keys, no remote code fetched at runtime.

## Takeaway

Its output is *structured enough to parse*, which is what makes it a wiki ingestion source
rather than just a reading aid. Every report embeds a
`<script type="application/json" id="video-lens-meta">` block — `videoId`, `title`,
`channel`, `duration`, `publishDate`, `tags`, `keywords`, `generationDate` — so a downstream
script can lift structured metadata without scraping prose. That block is what
[`ingest_video.py`](../scripts/ingest_video.py) reads.

## Key points

- **Six local scripts, one pipeline** — `preflight.py` (extract video ID, detect duplicate
  reports, mint a temp payload path), `fetch_transcript.py`, `fetch_metadata.py` (yt-dlp
  enrichment: chapters, description, view count), `transcribe_local.py`, `render_report.py`,
  `serve_report.sh`.

  Transcript and metadata fetches are explicitly issued concurrently — they both depend only
  on the video ID, not on each other.

- **The agent never writes HTML** — it writes a JSON payload and the renderer templates it.

  `render_report.py` allowlist-sanitises `KEY_POINTS`, `OUTLINE` and `DESCRIPTION_SECTION`:
  no `<script>`, `<style>`, `<iframe>`, inline handlers, non-HTTP URLs, or outline links
  pointing at a different video. It also validates that `VIDEO_URL` resolves to the same
  video ID it was given. Determinism plus a sanitiser, rather than trusting the model's markup.

- **Chapters anchor the outline when yt-dlp supplies them** — chapter titles are used
  verbatim and the model writes only the one-sentence detail per segment.

  Where the uploader has done the segmentation, the skill defers to it and spends the model
  only on what the model is better at.

- **Prompt injection is addressed explicitly** — the skill instructs that transcript and
  description text are *data, not instructions*, and that they must never alter the output
  filename, JSON keys, tag allowlist, or any step of the procedure.

- **Local Whisper fallback when captions are missing** — yt-dlp pulls audio, `mlx-whisper`
  transcribes it. Apple Silicon only, ~4–8 min per hour of video, ~1.5 GB one-time model
  download, and the skill requires asking the user before starting.

- **Tag vocabulary is deliberately convergent** — preflight emits `EXISTING_TAGS` from
  previously saved reports and the model is told to prefer an existing tag over inventing
  a near-duplicate.

  A small idea with outsized effect on any growing collection: without it, tag sets fragment
  into `llm engineering` / `context engineering` / `llm` and filtering stops working. The
  same failure mode threatens this wiki's own tags.

## Constraints worth remembering

- YouTube Shorts are unsupported; the skill stops on them.
- Steps 5–6 (serve on `localhost:8765`, open a browser, rebuild the gallery index) assume a
  local workstation. In a cloud session they are inert — render, then ingest directly.
- Reports are written under `~/Downloads/video-lens/reports/` and the renderer *enforces*
  that path; `--output-dir` elsewhere fails with `ERROR:RENDER_INVALID_OUTPUT_PATH`.
  Copy into `raw/videos/` after rendering rather than trying to render into the wiki.

## Ripple

- concepts: [Video ingestion](../concepts/video-ingestion.md), [LLM wiki pattern](../concepts/llm-wiki-pattern.md)
- entities: [video-lens](../entities/video-lens.md)
- contradicts: nothing yet

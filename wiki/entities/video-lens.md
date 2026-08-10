---
title: video-lens
type: entity
kind: tool
tags: [tooling, video, agents]
sources:
  - sources/2026-08-10-video-lens-repo.md
updated: 2026-08-10
---

# video-lens

An agent skill by [kar2phi](https://github.com/kar2phi) that turns a YouTube URL into a
self-contained HTML research report. MIT licensed. This wiki uses it as the front half of
[video ingestion](../concepts/video-ingestion.md).

## Status here

Installed in this session at `~/.claude/skills/video-lens/` (plus `video-lens-gallery`),
with `youtube-transcript-api` and `yt-dlp` on the Python path. Verified working offline:
`preflight.py` and `render_report.py` both run correctly. **Not** verified against YouTube —
network egress to `www.youtube.com` is denied in this environment.

Note that the installation lives in the session container, not in this repository, and does
not survive the container. On a new machine or session, install it again:

```bash
npx skills add kar2phi/video-lens
pip install youtube-transcript-api yt-dlp
```

## Interface this wiki depends on

Only two things, both stable enough to build on and both worth re-checking if the skill
majors:

1. Reports are written to `~/Downloads/video-lens/reports/` — the renderer enforces this
   path and rejects any other `--output-dir`.
2. Each report embeds `<script type="application/json" id="video-lens-meta">` carrying
   `videoId`, `title`, `channel`, `duration`, `publishDate`, `generationDate`, `tags` and
   `keywords`, and renders its content into `section#summary`, `section#takeaway`,
   `section#key-points` and `ol.topics`.

[`ingest_video.py`](../scripts/ingest_video.py) reads exactly those. If a future version
renames a section id, ingestion fails loudly (`no content sections found`) rather than
producing a quietly empty page.

## Read in full

[Source page](../sources/2026-08-10-video-lens-repo.md) — pipeline, sanitiser, chapter
handling, Whisper fallback, and its constraints.

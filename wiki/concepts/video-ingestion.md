---
title: Video ingestion
type: concept
tags: [video, tooling, knowledge-management]
sources:
  - sources/2026-08-10-video-lens-repo.md
  - sources/2026-08-10-karpathy-llm-wiki-gist.md
updated: 2026-08-10
---

# Video ingestion

Bringing talks, interviews and lectures into a wiki whose native format is text. The
problem is not transcription — it is that a transcript is the *worst* form of the content:
longer than the video, less scannable, and stripped of the structure a viewer gets for free.

## The pipeline

```
YouTube URL
   → video-lens          transcript → summary, takeaway, key points, timestamped outline
   → raw/videos/*.html   the report, immutable, kept as the original
   → ingest_video.py     report → sources/YYYY-MM-DD-<slug>.md
   → ripple              concepts/, entities/, index.md, log.md   ← by hand
```

The split matters: [`ingest_video.py`](../scripts/ingest_video.py) is deterministic parsing
and covers only step 4 of ingest. Steps 5–7 are judgment and stay with the agent.

## Why the report is the raw source, not the transcript

The report is what a reader would actually consult, it carries the analysis already done,
and it embeds machine-readable metadata. Keeping *it* in `raw/` rather than the transcript
means the immutable layer holds something a human can open and read.

The cost is honest and worth stating: the report is already an interpretation. The
transcript is the more faithful original. If a claim is ever contested, the report is not
sufficient evidence — the video is, at the timestamp.

## Timestamps are the point

Every outline entry keeps its `&t=<seconds>` deep link through ingestion. This is what makes
a video source citable at the same granularity as a paragraph in an article: a concept page
can link a claim to the exact second that supports it, and a reader can check it in one
click. Without that, a video source is a summary you have to trust.

## Failure modes specific to video

- **Partial coverage passed off as full.** Long transcripts may exceed context. The summary
  must state the range covered — "first 2h of a 3h video" — rather than implying completeness.
- **Description as smuggled content.** Uploader descriptions are promotional as often as
  informative and are a prompt-injection surface. They are ingested verbatim, quoted, and
  labelled as the uploader's words — never merged into synthesis.
- **No captions.** Local Whisper transcription is the fallback; it needs the audio, which
  needs the same network access the transcript did.
- **Two different network walls, often confused.** They fail at different layers and only
  one is a setting:
  - *Environment egress policy.* The session's own proxy refuses the host — `403` on
    CONNECT, before any request reaches YouTube. Fixed by raising the environment's
    network access to **Custom** and allowing `youtube.com`, `*.youtube.com`,
    `*.googlevideo.com`, `*.ytimg.com`, `youtubei.googleapis.com`.
  - *Provider bot detection.* CONNECT succeeds and Google refuses the content anyway:
    the watch page redirects to `/sorry/index`, `api/timedtext` returns `429`, and the
    innertube API answers `LOGIN_REQUIRED — "Sign in to confirm you're not a bot"`. No
    setting fixes this; it is the datacenter IP's reputation.
- **No JavaScript runtime → every media download 403s.** yt-dlp needs one (`deno`) to sign
  media URLs. Captions arrive by a different path and can still succeed, so a session goes
  half-mined — transcript yes, frames no — without the failure being obvious. Always
  confirm the `.mp4` exists and is non-empty before running the frame extractor.
- **Player client matters.** The `web` client draws the bot check first; `visionos` gets
  through where `web` does not (`--extractor-args "youtube:player_client=visionos"`).

See [the source page](../sources/2026-10-06-possible-top-in-place-today.md) for a worked
example of all four hitting the same video.

## See also

- [LLM wiki pattern](llm-wiki-pattern.md)
- [video-lens](../entities/video-lens.md)

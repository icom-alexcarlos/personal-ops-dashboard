---
title: "Possible Top In Place Today - Episode 080526"
type: source
medium: video
status: pending
tags: []
video_id: v4bxMPJ0UiQ
channel: PATsTrading
url: https://www.youtube.com/watch?v=v4bxMPJ0UiQ
ingested:
updated: 2026-10-06
---

# Possible Top In Place Today - Episode 080526

[PATsTrading](../entities/patstrading.md) ·
[Watch on YouTube](https://www.youtube.com/watch?v=v4bxMPJ0UiQ) ·
thumbnail: [`raw/videos/v4bxMPJ0UiQ-hqdefault.jpg`](../raw/videos/v4bxMPJ0UiQ-hqdefault.jpg)

**Status: identity verified, content not read.**

Title and channel are confirmed against YouTube's own oEmbed endpoint on 2026-10-06, and
the thumbnail is mirrored in `raw/`. Beyond that, nothing: no transcript was obtained and
no frame was ever decoded. There is no summary, no takeaway, no key points and no tags on
this page, because producing any of them would mean inventing them. Nothing here may be
cited as a claim about what the episode says or shows.

The episode number `080526` is **not** recorded as a date. The video-lens skill's own
guidance is that titles can lie and the spoken date is the one to trust — and no one has
heard this one speak.

## Correction: this is not a Karpathy video

Requested on 2026-08-10 alongside Andrej Karpathy's llm-wiki material, and assumed by the
surrounding work — including the branch name — to be his. It is not. It is a price-action
day-trading session review. The original placeholder recorded the speaker as unknown and
warned against assuming; that caution is what made this correction cheap instead of a
retraction of fabricated content. See [Andrej Karpathy](../entities/andrej-karpathy.md).

## Why it is still pending — a worked example of four distinct walls

The 2026-08-10 attempt failed at the first wall. The 2026-10-06 rerun cleared two more and
stopped at the fourth.

| # | Wall | Status | Evidence |
|---|---|---|---|
| 1 | Environment egress policy | **cleared** | `CONNECT` now returns `200 Connection Established`; previously `403` |
| 2 | Missing JavaScript runtime | **cleared** | installing `deno` 2.9.7 let yt-dlp read the player and list formats |
| 3 | Bot detection on the `web` client | **worked around** | `web` → `LOGIN_REQUIRED, "Sign in to confirm you're not a bot"`; `visionos` gets through |
| 4 | Media signing / rate limit | **blocking** | every video format → `HTTP Error 403: Forbidden`; `api/timedtext` → `429` |

Wall 4 is the live one. Extraction succeeds — yt-dlp selects format 137 and lists the
`en` and `en-orig` subtitle tracks — and then the media URLs themselves are refused, which
is the Google Video Server PO-token requirement that a datacenter IP cannot satisfy.
Captions fail separately with `429` on a rate-limited endpoint.

This matches the video-lens skill's own stated limit: *"It cannot run in a sandbox that
blocks fetching YouTube — download on a machine with network access, then point the
extractor at the local `.mp4`."*

## How to clear it

Run the fetch where the IP is not flagged — an ordinary residential machine — then bring
the artifacts here:

```bash
# on a local machine
yt-dlp -f 137 -o patstrading-080526.mp4 "https://www.youtube.com/watch?v=v4bxMPJ0UiQ"
yt-dlp --skip-download --write-auto-subs --sub-langs "en.*,en" --sub-format vtt \
       -o patstrading-080526 "https://www.youtube.com/watch?v=v4bxMPJ0UiQ"
```

Drop both into `wiki/raw/videos/v4bxMPJ0UiQ/`, then extract frames at the moments the
transcript marks with "here" / "this bar" / "the 21", read the stills, and rewrite this
page from what the frames actually show. `wiki/scripts/ingest_video.py` does **not** apply
to this route — it parses a kar2phi/video-lens HTML report, not an `.mp4` plus `.vtt`.

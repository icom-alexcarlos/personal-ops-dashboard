---
title: "YouTube v4bxMPJ0UiQ — not yet ingested"
type: source
medium: video
status: pending
tags: []
video_id: v4bxMPJ0UiQ
url: https://www.youtube.com/watch?v=v4bxMPJ0UiQ
ingested:
updated: 2026-08-10
---

# YouTube v4bxMPJ0UiQ

[Watch on YouTube](https://www.youtube.com/watch?v=v4bxMPJ0UiQ)

**Status: pending — content unavailable, nothing has been read.**

This page is a placeholder so the source is tracked rather than forgotten. Per
[the schema](../CLAUDE.md), a pending source stays empty: no summary, no key points,
no tags. The title, topic, and channel are unknown. Nothing here may be cited.

## Why it is pending

Requested for ingestion on 2026-08-10 in a cloud session whose network policy denies
`www.youtube.com`. Both fetch paths failed identically:

```
ERROR:TRANSCRIPT_FETCH_FAILED: HTTPSConnectionPool(host='www.youtube.com', port=443):
  ... ProxyError('Unable to connect to proxy',
      OSError('Tunnel connection failed: 403 Forbidden'))
ERROR:YTDLP_NO_OUTPUT: yt-dlp produced no output — ERROR: [youtube] v4bxMPJ0UiQ:
  Unable to download API page: ('Unable to connect to proxy',
      OSError('Tunnel connection failed: 403 Forbidden'))
```

A 403 on CONNECT is an egress policy denial, not a transient failure. The Whisper
fallback does not route around it — it downloads audio from the same host.

## How to clear it

Either raise the environment's network access to **Custom** with `youtube.com`,
`*.youtube.com`, `*.googlevideo.com`, `*.ytimg.com` and `youtubei.googleapis.com`
allowed and re-run in a fresh session, or run video-lens on a local machine. Then:

```bash
/video-lens https://www.youtube.com/watch?v=v4bxMPJ0UiQ
cp ~/Downloads/video-lens/reports/<report>.html wiki/raw/videos/
python3 wiki/scripts/ingest_video.py wiki/raw/videos/<report>.html
```

The generated page takes its own name from the report's date and title, so it lands
beside this one rather than replacing it. Delete this placeholder once the real page
exists, then continue with ingest steps 5–7: ripple, index, log.

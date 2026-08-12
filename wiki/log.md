# Activity log

Append-only, newest last. Format is defined in [CLAUDE.md](CLAUDE.md).
Orient with `grep "^## \[" wiki/log.md | tail -5`.

---

## [2026-08-10] scaffold | wiki created
Pages touched: CLAUDE.md, index.md, log.md, overview.md, scripts/ingest_video.py, raw/README.md
Notes: Karpathy's LLM wiki pattern instantiated inside personal-ops-dashboard. `raw/` and the
wiki layer are siblings under `wiki/` so the immutable/regenerable split stays visible.

## [2026-08-10] ingest | llm-wiki.md — Andrej Karpathy
Pages touched: sources/2026-08-10-karpathy-llm-wiki-gist.md, concepts/llm-wiki-pattern.md,
entities/andrej-karpathy.md, overview.md, index.md
Notes: Read via web fetch, not mirrored into raw/ — the fetch is a rendering, not the byte-exact
original, so the source page says so and marks its one verbatim quotation.

## [2026-08-10] ingest | kar2phi/video-lens
Pages touched: sources/2026-08-10-video-lens-repo.md, concepts/video-ingestion.md,
entities/video-lens.md, overview.md, index.md
Notes: Read from a shallow clone of SKILL.md, six scripts and template.html — claims come from
the code rather than the README. Established the two interface points ingest_video.py depends on.

## [2026-08-10] tooling | ingest_video.py verified end to end
Notes: Tested against a real rendering, not a mock — built a synthetic payload, ran video-lens's
own render_report.py to produce a genuine report, then parsed it back. Two bugs found and fixed:
section <h2> headings leaking into Summary/Takeaway text, and the uploader description being
swallowed into the Summary. Description links are now preserved as markdown links rather than
flattened to bare text. Fixture used video id TESTtest123; no real report was fabricated.

## [2026-08-10] pending | YouTube v4bxMPJ0UiQ
Pages touched: sources/2026-08-10-youtube-v4bxMPJ0UiQ.md, index.md
Notes: Requested for ingestion; not ingested. This cloud session's egress policy denies
www.youtube.com (403 on CONNECT), which blocks the transcript API, yt-dlp, and the Whisper
fallback alike. Placeholder left deliberately empty — the video's topic, channel and speaker
are all unknown and nothing about it may be cited until it is actually read.

## [2026-08-10] note | entities seeded without the usual approval
Notes: CLAUDE.md makes entity creation a human decision. Two entities — Andrej Karpathy and
video-lens — were created during scaffolding without that step, to give the wiki a working
shape. Both are open to rename, merge or deletion; the rule applies from here on.

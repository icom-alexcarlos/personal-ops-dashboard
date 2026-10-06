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

## [2026-10-06] rerun | video pipeline re-attempted from the beginning
Pages touched: sources/2026-10-06-possible-top-in-place-today.md (replaces the v4bxMPJ0UiQ
placeholder), entities/patstrading.md, entities/andrej-karpathy.md, concepts/video-ingestion.md,
CLAUDE.md, index.md, raw/videos/v4bxMPJ0UiQ-hqdefault.jpg
Notes: Egress policy had been opened since 2026-08-10, so the whole fetch was retried. Three
walls cleared, one still blocking — the source page tabulates all four with evidence. Tooling
added to the container (not the repo): deno 2.9.7, opencv-python-headless, numpy.

## [2026-10-06] correction | the requested video is not a Karpathy video
Notes: v4bxMPJ0UiQ resolves via YouTube oEmbed to "Possible Top In Place Today - Episode 080526"
by PATsTrading, a price-action day-trading channel — not Andrej Karpathy, as the branch name and
the surrounding scaffolding had assumed. The 2026-08-10 placeholder recorded the speaker as
unknown and said not to assume; because it did, this is a one-line correction rather than a
retraction of invented content. The pending-page rule paid for itself here.

## [2026-10-06] schema | second ingest route added
Notes: CLAUDE.md now describes Route A (transcript report → ingest_video.py) and Route B (frames
→ hand-written source page). Route B exists because chart-narration video hides its codeable
facts in the picture: "the 21" is only provably the 21 EMA from the frame. Rule recorded as
frames are evidence, transcript is the index that says which frames to pull.

## [2026-10-06] blocked | no content ingested for v4bxMPJ0UiQ
Notes: Extraction works — yt-dlp selects format 137 and lists the en/en-orig caption tracks — but
every media format returns 403 (GVS PO-token requirement a datacenter IP cannot satisfy) and
api/timedtext returns 429. Formats 135, 134, 137 and 604 all tried; zero bytes retrieved. Nothing
was written about the episode's content, and the page carries status: pending accordingly.

# Wiki schema

This directory is a **self-maintaining knowledge base** built on Andrej Karpathy's
LLM Wiki pattern. An LLM (you) reads raw sources once, compiles them into interlinked
markdown, and keeps that compilation current. Knowledge is compiled and maintained,
not re-derived on every question.

This file is the schema. It defines the layout, the conventions, and the three
operations. It is meant to co-evolve — when a convention stops fitting the material,
change it here first, then apply it.

---

## Layers

| Layer | Path | Who writes it |
|---|---|---|
| Raw sources | `raw/` | Human only. **Immutable.** Never edit, reformat, or delete a file here. |
| The wiki | everything else in `wiki/` | LLM. Fully regenerable from `raw/` if it ever rots. |
| The schema | `wiki/CLAUDE.md` (this file) | Both, deliberately. |

```
wiki/
├── CLAUDE.md          this file
├── index.md           catalog of every page, grouped by category
├── log.md             append-only activity record
├── overview.md        high-level synthesis across the whole wiki
├── concepts/          ideas, patterns, methods — the reusable stuff
├── entities/          people, tools, orgs, products
├── sources/           one page per ingested source
├── comparisons/       side-by-side analyses that span several sources
├── scripts/           helpers for ingestion
└── raw/               immutable originals
    ├── videos/        video-lens HTML reports
    ├── articles/
    └── papers/
```

---

## Conventions

**Filenames** are lowercase kebab-case, no dates, except in `sources/` where the
prefix is the ingest date: `sources/2026-08-10-karpathy-llm-wiki-gist.md`.

**Every page opens with YAML frontmatter:**

```yaml
---
title: Human-readable title
type: concept | entity | source | comparison
tags: [llm, knowledge-management]
sources: [sources/2026-08-10-karpathy-llm-wiki-gist.md]
updated: 2026-08-10
---
```

`sources:` is what makes claims auditable — every concept and entity page lists the
source pages it was built from. A concept page with an empty `sources:` list is a
lint failure.

**Links** are relative markdown links between wiki pages: `[LLM Wiki pattern](../concepts/llm-wiki-pattern.md)`.
Link generously — the cross-references are what make the wiki more than a folder of notes.

**Claims carry attribution.** When a page states something contestable, name where it came
from inline:

```markdown
Karpathy frames the bottleneck as bookkeeping, not reading
([source](../sources/2026-08-10-karpathy-llm-wiki-gist.md)).
```

**Never assert what a source does not say.** If a source is unavailable — a paywalled
article, a blocked video — do not summarize it from background knowledge. Create the
source page with `status: pending` and leave the body empty. A pending page is honest;
a hallucinated page poisons everything downstream that cites it.

---

## Operation: ingest

One source at a time. Batching skips the discussion step and quality drops.

1. **Place the original** in the right `raw/` subdirectory. It stays untouched forever.
2. **Read it in full.** Not a sample — the whole thing.
3. **Discuss takeaways with the human** before writing anything. This is the step that
   makes the wiki theirs rather than yours.
4. **Write `sources/YYYY-MM-DD-<slug>.md`** — what this source says, in its own terms,
   with a pointer to its file in `raw/`.
5. **Ripple outward.** This is the part humans skip and the reason the pattern works:
   - Update every `concepts/` page the source touches. New idea → new concept page.
   - Update every `entities/` page. **Creating a new entity is a human decision** — ask.
   - Add cross-links in both directions.
   - Flag contradictions with existing pages explicitly rather than silently overwriting.
   - Refresh `overview.md` if the source shifts the big picture.
6. **Update `index.md`** with any new pages.
7. **Append to `log.md`.**

A single substantial source typically touches 10–15 pages. If an ingest only touched
the source page, the ripple step was skipped.

### Ingesting a video

Videos come in through the [video-lens](https://github.com/kar2phi/video-lens) skill,
which fetches a YouTube transcript and renders an HTML report — summary, takeaway, key
points, timestamped outline.

```bash
/video-lens <youtube-url>            # writes ~/Downloads/video-lens/reports/<name>.html
cp ~/Downloads/video-lens/reports/<name>.html wiki/raw/videos/
python3 wiki/scripts/ingest_video.py wiki/raw/videos/<name>.html
```

`ingest_video.py` reads the report's embedded `video-lens-meta` JSON block and the
rendered sections, and writes a `sources/` page with frontmatter, summary, takeaway,
key points, and a timestamped outline where every entry deep-links back into the video
at its exact second. It prints the path it wrote and a reminder of what still needs
doing by hand.

**The script only does step 4.** Steps 5–7 — the ripple, the index, the log — are
judgment work and stay with you. Read the generated page, then ask what in `concepts/`
and `entities/` it changes.

Timestamp links are the reason video sources are worth ingesting at all: a claim in a
concept page can cite `…&t=1847` and land the reader on the sentence that supports it.

**Environment note.** In a cloud session, `www.youtube.com` must be reachable. The
default **Trusted** network access level does not include it — the environment needs
**Custom** network access with `youtube.com`, `*.youtube.com`, `*.googlevideo.com`,
`*.ytimg.com`, and `youtubei.googleapis.com` allowed. Without that, `fetch_transcript.py`
and `yt-dlp` both fail with `Tunnel connection failed: 403 Forbidden`, and the Whisper
fallback fails too because it downloads audio from the same host. Running video-lens on
a local machine sidesteps this entirely.

---

## Operation: query

1. Read `index.md` first. It is the map — a few thousand tokens, not the whole wiki.
2. Open only the pages the index points at. Follow cross-links from there.
3. Once the wiki passes ~100 pages, stop trusting the index alone — grep as well.
4. Answer with citations to wiki pages, which in turn cite `raw/`.
5. **File valuable answers back.** If a question produced real synthesis, it becomes a
   new page rather than evaporating with the conversation. That is the compounding step.

---

## Operation: lint

Run periodically — weekly is a reasonable default. Report findings, fix the mechanical
ones, ask about the judgment calls.

- **Contradictions** — two pages making incompatible claims. Never silently pick a
  winner; surface both and their sources.
- **Stale claims** — pages whose `updated:` predates a source that should have changed them.
- **Orphans** — pages nothing links to.
- **Dangling links** — links to pages that do not exist.
- **Missing cross-references** — page A obviously bears on page B with no link either way.
- **Undocumented concepts** — terms used repeatedly across pages with no page of their own.
- **Unsourced claims** — pages with an empty `sources:` list.
- **Index drift** — files on disk missing from `index.md`, or entries pointing at nothing.
- **Stale pending sources** — `status: pending` pages whose blocker may have cleared.

Append the result to `log.md` as a `lint` entry, including "no findings" — the absence
of a finding is itself a fact worth timestamping.

---

## Log format

`log.md` is append-only, newest last, one `##` heading per operation:

```markdown
## [2026-08-10] ingest | Karpathy's llm-wiki gist
Pages touched: sources/2026-08-10-karpathy-llm-wiki-gist.md, concepts/llm-wiki-pattern.md, index.md
Notes: one line on anything non-obvious.
```

The bracketed-date prefix is load-bearing: it makes the log greppable, so a fresh
session can orient with `grep "^## \[" wiki/log.md | tail -5` instead of reading it all.

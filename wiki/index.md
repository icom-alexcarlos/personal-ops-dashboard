---
title: Index
type: index
updated: 2026-10-06
---

# Index

The catalog. Read this first, then open only what it points at. Every page in the wiki
appears here — a page missing from this list is a lint finding.

- **[Overview](overview.md)** — synthesis across everything currently known
- **[Schema](CLAUDE.md)** — layout, conventions, and the ingest / query / lint procedures
- **[Log](log.md)** — chronological record of every operation

## Concepts

| Page | What it covers |
|---|---|
| [LLM wiki pattern](concepts/llm-wiki-pattern.md) | Compiling sources into a maintained wiki instead of retrieving per query; why the bottleneck is bookkeeping; the three operations and how the pattern fails |
| [Video ingestion](concepts/video-ingestion.md) | Getting talks and interviews into a text wiki; why the report is the raw source; timestamps as citations |

## Entities

| Page | Kind | Why it's here |
|---|---|---|
| [Andrej Karpathy](entities/andrej-karpathy.md) | person | Author of the llm-wiki proposal this wiki implements |
| [PATsTrading](entities/patstrading.md) | channel | Price-action trading channel; identity only, no episode watched yet |
| [video-lens](entities/video-lens.md) | tool | The YouTube→report front half of video ingestion; the interface `ingest_video.py` depends on |

## Sources

| Page | Medium | Date | Status |
|---|---|---|---|
| [llm-wiki.md — Andrej Karpathy](sources/2026-08-10-karpathy-llm-wiki-gist.md) | gist | 2026-08-10 | ingested |
| [kar2phi/video-lens](sources/2026-08-10-video-lens-repo.md) | repository | 2026-08-10 | ingested |
| [Possible Top In Place Today - Episode 080526](sources/2026-10-06-possible-top-in-place-today.md) | video | — | **pending** — identity verified, content never fetched |

## Comparisons

None yet.

## Tooling

| Path | Purpose |
|---|---|
| [`scripts/ingest_video.py`](scripts/ingest_video.py) | video-lens HTML report → `sources/` page. Covers ingest step 4 only |
| [`raw/README.md`](raw/README.md) | The immutability rule for `videos/`, `articles/`, `papers/` |

Video ingestion has two routes, described in [the schema](CLAUDE.md): **A** a transcript
report parsed by `ingest_video.py`, **B** frames pulled from the `.mp4` and read directly.
Route B is mandatory for anything narrated over a chart or screen.

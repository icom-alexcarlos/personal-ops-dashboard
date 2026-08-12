---
title: Index
type: index
updated: 2026-08-10
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
| [video-lens](entities/video-lens.md) | tool | The YouTube→report front half of video ingestion; the interface `ingest_video.py` depends on |

## Sources

| Page | Medium | Date | Status |
|---|---|---|---|
| [llm-wiki.md — Andrej Karpathy](sources/2026-08-10-karpathy-llm-wiki-gist.md) | gist | 2026-08-10 | ingested |
| [kar2phi/video-lens](sources/2026-08-10-video-lens-repo.md) | repository | 2026-08-10 | ingested |
| [YouTube v4bxMPJ0UiQ](sources/2026-08-10-youtube-v4bxMPJ0UiQ.md) | video | — | **pending** — network blocked, nothing read |

## Comparisons

None yet.

## Tooling

| Path | Purpose |
|---|---|
| [`scripts/ingest_video.py`](scripts/ingest_video.py) | video-lens HTML report → `sources/` page. Covers ingest step 4 only |
| `raw/` | Immutable originals — `videos/`, `articles/`, `papers/`. Never edited |

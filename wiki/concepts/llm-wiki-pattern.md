---
title: LLM wiki pattern
type: concept
tags: [llm, knowledge-management, agents]
sources:
  - sources/2026-08-10-karpathy-llm-wiki-gist.md
updated: 2026-08-10
---

# LLM wiki pattern

A knowledge base that an LLM **maintains** rather than merely searches. Sources are read
once and compiled into interlinked markdown; the compilation is then kept current as new
sources arrive. The wiki, not the source pile, is what gets queried.

## The claim it makes against RAG

RAG re-derives understanding on every query: retrieve chunks, reason over them, discard the
reasoning. Cost and quality are constant per question, and nothing accumulates. The wiki
pattern moves that work to ingest time and keeps the result. Answering a question a second
time is cheap because the synthesis already exists as a page.

The trade is real, not free — ingest becomes expensive, and the wiki can drift from its
sources. [Lint](#lint) exists to pay that debt down.

## Why an LLM specifically

Not because the reading is hard. Karpathy's framing is that the abandonment point for
human-maintained knowledge bases is the **bookkeeping**: after adding a note, updating the
six other pages it bears on, fixing the index, re-checking claims it contradicts. That work
is mechanical, unrewarding, and unbounded — and it is what LLMs are good at
([source](../sources/2026-08-10-karpathy-llm-wiki-gist.md)).

So the division of labour is: the human curates what enters and directs the analysis; the
model does the ripple.

## Structure

Three layers — raw sources, the wiki, the schema — described concretely for this wiki in
[CLAUDE.md](../CLAUDE.md). The load-bearing property is that the **wiki layer is
regenerable**: if the compilation rots, `raw/` still holds the truth and the wiki can be
rebuilt. This is why `raw/` is immutable and why sources are never summarised away.

Two navigation files carry the reading cost:

- `index.md` — read first, always. A few thousand tokens that decide what to open.
- `log.md` — append-only, greppable, so a cold session can orient in one command.

## Operations

**Ingest** — one source at a time, discuss before writing, then ripple outward. A
substantial source touches 10–15 pages. An ingest that touched only its own source page
skipped the step that makes the pattern work.

**Query** — index first, then the pages it points at, answer with citations. Then the
compounding move: file valuable answers back as pages. A synthesis that stays in the chat
log is work done twice.

**Lint** — periodic health check: contradictions, stale claims, orphans, missing
cross-references, unsourced claims. The wiki is a mutable artifact maintained by a
non-deterministic process; without lint it degrades silently.

## Known failure modes

- **Hallucinated pages.** A page written from background knowledge rather than a source is
  indistinguishable from a real one once written, and everything citing it inherits the
  error. Hence: unavailable source → `status: pending`, empty body, never a guess.
- **Silent contradiction resolution.** When a new source disagrees with an existing page,
  overwriting hides the disagreement. Surface both and their sources.
- **Index rot past ~100 pages.** The catalog stops being a sufficient search mechanism;
  grep has to supplement it.
- **Tag fragmentation.** Independently chosen tags drift into near-duplicates and filtering
  stops working — the same problem video-lens solves by feeding existing tags back into
  the tagging prompt ([source](../sources/2026-08-10-video-lens-repo.md)).

## See also

- [Video ingestion](video-ingestion.md) — the pattern applied to a source type with no text
- [Andrej Karpathy](../entities/andrej-karpathy.md)

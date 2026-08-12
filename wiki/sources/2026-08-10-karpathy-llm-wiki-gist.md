---
title: "llm-wiki.md — Andrej Karpathy"
type: source
medium: gist
tags: [llm, knowledge-management, agents]
url: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
ingested: 2026-08-10
updated: 2026-08-10
---

# llm-wiki.md

[Original gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) · Andrej Karpathy

> Read via web fetch on 2026-08-10; not mirrored into `raw/` because the fetch is a
> rendering rather than the byte-exact original. Re-fetch before treating any quotation
> here as verbatim beyond the one marked below.

## Summary

Proposes replacing query-time retrieval (RAG) with **compile-time compilation**: an LLM
reads sources once and incrementally builds a persistent, interlinked markdown wiki that
sits between the human and the raw material. When new sources arrive the model integrates
them into existing pages, updates cross-references, and flags contradictions. Knowledge
compounds instead of being re-derived per query.

## Takeaway

The argument is about labour, not capability. Quoted: *"The tedious part of maintaining a
knowledge base is not the reading or the thinking — it's the bookkeeping."* Humans abandon
knowledge bases at the maintenance step; that step is exactly what an LLM is good at. So
the split is: humans curate sources and direct analysis, the model does everything else.

## Key points

- **Three layers** — raw sources (immutable originals), the wiki (LLM-generated markdown),
  and a schema/config file documenting structure and workflows.

  The schema layer is the part that makes it a system rather than a folder. Karpathy
  frames it as co-evolving: *"You and the LLM co-evolve this over time as you figure out
  what works for your domain."*

- **Three operations** — ingest, query, lint.

  Ingest processes new sources one at a time, discussing takeaways before writing.
  Query searches the wiki and synthesises with citations. Lint is a periodic health check
  for contradictions, stale claims, orphan pages, and missing cross-references.

- **Two navigation files** — `index.md` is a content-oriented catalog by category;
  `log.md` is an append-only chronological record of ingests, queries, and lint passes.

  `index.md` exists so the model reads a few thousand tokens to decide what to open,
  rather than loading the whole wiki. `log.md` gives a fresh session its orientation.

- **Filing answers back is the compounding step** — a valuable query result becomes a new
  wiki page rather than evaporating with the conversation.

- **Human-in-the-loop is scoped, not global** — entity creation is called out as a decision
  that needs a human; most other wiki operations can be automated.

## Ripple

- concepts: [LLM wiki pattern](../concepts/llm-wiki-pattern.md)
- entities: [Andrej Karpathy](../entities/andrej-karpathy.md)
- contradicts: nothing yet

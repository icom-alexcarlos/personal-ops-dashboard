---
title: Overview
type: overview
updated: 2026-10-06
---

# Overview

What this wiki currently knows, in one page. Rewritten when an ingest shifts the big
picture — not on every ingest.

## Present state

Two sources ingested, both about the wiki's own machinery: the pattern it implements and
the tool that feeds video into it. One source pending — identity now verified, content
still unread. No domain knowledge yet; this is a knowledge base that so far knows only how
to be one.

## The through-line

A knowledge base fails at maintenance, not at capture. Karpathy's proposal is to hand the
maintenance — the ripple across pages, the cross-references, the contradiction checks — to
the model, and keep curation and direction with the human
([pattern](concepts/llm-wiki-pattern.md)).

Applying that to video exposes what the pattern needs from a source: not text, but
*structure*. video-lens is useful here less because it summarises well than because its
output is parseable and its timestamps survive ingestion, which keeps a video citable at
the second ([video ingestion](concepts/video-ingestion.md)).

The recurring risk across both is the same: a compiled artifact maintained by a
non-deterministic process drifts from its sources, and drift is invisible from inside.
Every countermeasure here is a version of *keep the original and keep the pointer* —
immutable `raw/`, `sources:` frontmatter on every page, timestamp deep links, empty
`status: pending` pages instead of plausible guesses, and a lint pass that goes looking
for the drift on purpose.

## What the rerun taught

Re-attempting the blocked video on 2026-10-06 was worth more than the video would have
been. It produced the wiki's first genuine correction — the source everyone assumed was a
Karpathy talk is a PATsTrading price-action session — and it cost one line, because the
placeholder had recorded the speaker as unknown instead of guessing. That is the
`status: pending` rule earning its place rather than merely being stated.

It also split one vague obstacle into four named ones, three of them clearable: egress
policy, missing JS runtime, bot detection on the `web` player client, and media signing.
Only the last still blocks, and only because the IP is a datacenter's. A failure described
at that resolution is a procedure; "it didn't work" is not.

## Where it goes next

The wiki is scaffolding until real subject matter lands in it. The pending video remains
the first end-to-end test of the ingest path, and it now needs a fetch from an unflagged
machine rather than another attempt from here. Whatever follows should come from the
domains this repository already serves.

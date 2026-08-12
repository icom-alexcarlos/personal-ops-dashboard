---
title: Overview
type: overview
updated: 2026-08-10
---

# Overview

What this wiki currently knows, in one page. Rewritten when an ingest shifts the big
picture — not on every ingest.

## Present state

Two sources ingested, both about the wiki's own machinery: the pattern it implements and
the tool that feeds video into it. One source pending. No domain knowledge yet — this is a
knowledge base that so far knows only how to be one.

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

## Where it goes next

The wiki is scaffolding until real subject matter lands in it. The pending video is the
first test of the ingest path end to end; whatever follows it should come from the domains
this repository already serves.

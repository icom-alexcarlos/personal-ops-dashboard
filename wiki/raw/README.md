# raw/ — immutable sources

Originals live here. **Nothing in this directory is ever edited, reformatted, renamed, or
deleted by an agent.** Add files; don't touch what's already here.

This is the only layer that is not regenerable. Everything else in `wiki/` is a compilation
of these files and could be rebuilt from them if it ever rotted — which is exactly why the
compilation is allowed to be lossy and opinionated, and this directory is not.

```
raw/
├── videos/     video-lens HTML reports  (see ../concepts/video-ingestion.md)
├── articles/   saved web pages, markdown captures
└── papers/     PDFs
```

If a source can't be stored — paywalled, too large, a live page — record the URL and access
date in its `sources/` page and say plainly that the original is not mirrored.

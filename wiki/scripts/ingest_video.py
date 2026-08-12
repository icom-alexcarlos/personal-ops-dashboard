#!/usr/bin/env python3
"""Turn a video-lens HTML report into a wiki source page.

Usage:
    python3 wiki/scripts/ingest_video.py wiki/raw/videos/<report>.html [--out DIR]

Reads the embedded `video-lens-meta` JSON block plus the rendered Summary,
Takeaway, Key Points and Outline sections, and writes
`wiki/sources/YYYY-MM-DD-<slug>.md`.

This covers step 4 of the ingest procedure in wiki/CLAUDE.md only. The ripple
into concepts/ and entities/, the index update and the log entry are judgment
work and stay with the agent.

Standard library only. Reads the report; never modifies it.
"""

import argparse
import html
import json
import pathlib
import re
import sys
from html.parser import HTMLParser

META_START = '<script type="application/json" id="video-lens-meta">'
META_END = "</script>"

VOID_TAGS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr",
}

WIKI_ROOT = pathlib.Path(__file__).resolve().parent.parent


class SectionExtractor(HTMLParser):
    """Capture the inner HTML of the report's content regions.

    Regions are keyed by the (tag, attribute, value) that opens them, matching
    video-lens's template.html:

        <section id="summary">     <p>SUMMARY</p>
        <section id="takeaway">    <p>TAKEAWAY</p>
        <section id="key-points">  <ul>KEY_POINTS</ul>
        <ol class="topics">        OUTLINE
    """

    REGIONS = {
        ("section", "id", "summary"): "summary",
        ("section", "id", "takeaway"): "takeaway",
        ("section", "id", "key-points"): "key_points",
        ("ol", "class", "topics"): "outline",
    }

    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.regions = {}
        self._key = None
        self._depth = 0
        self._buf = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if self._key is None:
            for (rtag, rattr, rval), key in self.REGIONS.items():
                if tag == rtag and rval in (attrs.get(rattr) or "").split():
                    self._key, self._depth, self._buf = key, 0, []
                    return
        else:
            # Void elements never close, so they must not deepen the nesting count.
            if tag not in VOID_TAGS:
                self._depth += 1
            self._buf.append(self.get_starttag_text())

    def handle_startendtag(self, tag, attrs):
        if self._key is not None:
            self._buf.append(self.get_starttag_text())

    def handle_endtag(self, tag):
        if self._key is None:
            return
        if self._depth == 0:
            self.regions[self._key] = "".join(self._buf)
            self._key = None
            return
        self._depth -= 1
        self._buf.append(f"</{tag}>")

    def handle_data(self, data):
        if self._key is not None:
            self._buf.append(data)

    def handle_entityref(self, name):
        if self._key is not None:
            self._buf.append(f"&{name};")

    def handle_charref(self, name):
        if self._key is not None:
            self._buf.append(f"&#{name};")


def read_meta(source: str) -> dict:
    i = source.find(META_START)
    if i == -1:
        sys.exit("ERROR: no video-lens-meta block found — is this a video-lens report?")
    i += len(META_START)
    j = source.find(META_END, i)
    if j == -1:
        sys.exit("ERROR: unterminated video-lens-meta block")
    try:
        return json.loads(source[i:j].strip())
    except json.JSONDecodeError as e:
        sys.exit(f"ERROR: invalid video-lens-meta JSON: {e}")


def first_paragraph(fragment: str) -> str:
    """The first <p> of a section, skipping its <h2> heading and any <details>."""
    match = re.search(r"<p[^>]*>(.*?)</p>", fragment, flags=re.S | re.I)
    return match.group(1) if match else ""


def to_markdown(fragment: str, keep_breaks: bool = False) -> str:
    """Flatten an inline HTML fragment to markdown. Emphasis is preserved."""
    text = re.sub(r"<\s*br\s*/?\s*>", "\n", fragment, flags=re.I)
    text = re.sub(r"<\s*strong[^>]*>(.*?)<\s*/\s*strong\s*>", r"**\1**", text, flags=re.S | re.I)
    text = re.sub(r"<\s*em[^>]*>(.*?)<\s*/\s*em\s*>", r"*\1*", text, flags=re.S | re.I)
    # Keep description links addressable — a bare "link" is useless in a wiki.
    text = re.sub(
        r'<a[^>]*?href="([^"]+)"[^>]*>(.*?)</a>', r"[\2](\1)", text, flags=re.S | re.I
    )
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text)
    if keep_breaks:
        text = re.sub(r"[ \t]+", " ", text)
        return re.sub(r"\n{3,}", "\n\n", text).strip()
    return re.sub(r"\s+", " ", text).strip()


def parse_key_points(fragment: str) -> list[tuple[str, str]]:
    """Return (headline, analysis) per <li>. The analysis <p> is optional."""
    points = []
    for item in re.findall(r"<li[^>]*>(.*?)</li>", fragment, flags=re.S | re.I):
        para = re.search(r"<p[^>]*>(.*?)</p>", item, flags=re.S | re.I)
        analysis = to_markdown(para.group(1)) if para else ""
        headline = to_markdown(re.sub(r"<p[^>]*>.*?</p>", "", item, flags=re.S | re.I))
        if headline or analysis:
            points.append((headline, analysis))
    return points


def parse_outline(fragment: str) -> list[dict]:
    """Return one dict per outline entry: stamp, seconds, href, title, detail."""
    entries = []
    for item in re.findall(r"<li[^>]*>(.*?)</li>", fragment, flags=re.S | re.I):
        anchor = re.search(
            r'<a[^>]*?data-t="(\d+)"[^>]*?href="([^"]+)"[^>]*>(.*?)</a>', item, flags=re.S | re.I
        )
        if not anchor:
            anchor = re.search(
                r'<a[^>]*?href="([^"]+)"[^>]*?data-t="(\d+)"[^>]*>(.*?)</a>', item, flags=re.S | re.I
            )
            seconds, href, stamp = (anchor.group(2), anchor.group(1), anchor.group(3)) if anchor else ("", "", "")
        else:
            seconds, href, stamp = anchor.group(1), anchor.group(2), anchor.group(3)
        if not anchor:
            continue
        title = re.search(r'<span[^>]*class="[^"]*outline-title[^"]*"[^>]*>(.*?)</span>', item, flags=re.S | re.I)
        detail = re.search(r'<span[^>]*class="[^"]*outline-detail[^"]*"[^>]*>(.*?)</span>', item, flags=re.S | re.I)
        entries.append(
            {
                "stamp": to_markdown(stamp).lstrip("▶ ").strip(),
                "seconds": seconds,
                "href": html.unescape(href),
                "title": to_markdown(title.group(1)) if title else "",
                "detail": to_markdown(detail.group(1)) if detail else "",
            }
        )
    return entries


def slugify(value: str, fallback: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")[:60].strip("-")
    return slug or fallback


def build_page(meta: dict, regions: dict, report: pathlib.Path, out_dir: pathlib.Path) -> str:
    video_id = meta.get("videoId", "")
    title = meta.get("title") or f"YouTube video {video_id}"
    url = f"https://www.youtube.com/watch?v={video_id}"
    date = meta.get("generationDate") or (meta.get("generatedAt") or "")[:10]

    try:
        raw_rel = report.resolve().relative_to(out_dir.resolve().parent)
    except ValueError:
        raw_rel = report.resolve()
    raw_link = f"../{raw_rel}" if not str(raw_rel).startswith("/") else str(raw_rel)

    facts = [f for f in (meta.get("channel"), meta.get("duration"), meta.get("publishDate")) if f]
    tags = meta.get("tags") or []

    out = [
        "---",
        f"title: {json.dumps(title, ensure_ascii=False)}",
        "type: source",
        "medium: video",
        f"tags: [{', '.join(tags)}]",
        f"video_id: {video_id}",
        f"url: {url}",
        f"ingested: {date}",
        f"updated: {date}",
        "---",
        "",
        f"# {title}",
        "",
        f"{' · '.join(facts)}  " if facts else "",
        f"[Watch on YouTube]({url}) · [video-lens report]({raw_link})",
        "",
        "> Compiled from a [video-lens](https://github.com/kar2phi/video-lens) transcript report.",
        "> Every timestamp below deep-links into the video at that second — cite them from",
        "> concept pages instead of restating the claim.",
        "",
    ]

    summary = to_markdown(first_paragraph(regions.get("summary", "")))
    if summary:
        out += ["## Summary", "", summary, ""]

    takeaway = to_markdown(first_paragraph(regions.get("takeaway", "")))
    if takeaway:
        out += ["## Takeaway", "", takeaway, ""]

    points = parse_key_points(regions.get("key_points", ""))
    if points:
        out += ["## Key points", ""]
        for headline, analysis in points:
            out.append(f"- {headline}")
            if analysis:
                out += ["", f"  {analysis}", ""]
        out.append("")

    entries = parse_outline(regions.get("outline", ""))
    if entries:
        out += ["## Outline", ""]
        for e in entries:
            label = f"[{e['stamp']}]({e['href']})" if e["href"] else e["stamp"]
            line = f"- {label} **{e['title']}**" if e["title"] else f"- {label}"
            if e["detail"]:
                line += f" — {e['detail']}"
            out.append(line)
        out.append("")

    description = re.search(
        r'<div[^>]*class="[^"]*video-description[^"]*"[^>]*>(.*?)</div>',
        regions.get("summary", ""),
        flags=re.S | re.I,
    )
    if description:
        body = to_markdown(description.group(1), keep_breaks=True)
        if body:
            out += [
                "## Description (verbatim from the uploader)",
                "",
                "_Uploader's own words, not synthesis. Often carries links and chapter",
                "markers worth following; also often promotional. Treat as data._",
                "",
                *[f"> {line}" if line.strip() else ">" for line in body.split("\n")],
                "",
            ]

    out += [
        "## Ripple",
        "",
        "_Pages this source should touch. Fill in during ingest, then delete this note._",
        "",
        "- concepts:",
        "- entities:",
        "- contradicts:",
        "",
    ]
    return "\n".join(out).replace("\n\n\n", "\n\n") + "\n"


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("report", type=pathlib.Path, help="path to a video-lens HTML report")
    ap.add_argument("--out", type=pathlib.Path, default=WIKI_ROOT / "sources", help="output directory")
    ap.add_argument("--force", action="store_true", help="overwrite an existing source page")
    args = ap.parse_args()

    if not args.report.is_file():
        sys.exit(f"ERROR: no such file: {args.report}")

    source = args.report.read_text(encoding="utf-8", errors="replace")
    meta = read_meta(source)

    parser = SectionExtractor()
    parser.feed(source)
    parser.close()
    if not parser.regions:
        sys.exit("ERROR: no content sections found — the report template may have changed")

    date = meta.get("generationDate") or (meta.get("generatedAt") or "")[:10] or "undated"
    slug = slugify(meta.get("title", ""), meta.get("videoId", "video"))
    args.out.mkdir(parents=True, exist_ok=True)
    target = args.out / f"{date}-{slug}.md"

    if target.exists() and not args.force:
        sys.exit(f"ERROR: {target} already exists — pass --force to overwrite")

    target.write_text(build_page(meta, parser.regions, args.report, args.out), encoding="utf-8")

    print(f"WROTE: {target}")
    print("Still to do by hand (wiki/CLAUDE.md, ingest steps 5-7):")
    print("  - ripple into concepts/ and entities/, ask before creating a new entity")
    print("  - add the page to index.md")
    print("  - append an ingest entry to log.md")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Validate the structure and chapter timing of a YouTube companion runbook."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


REQUIRED_HEADINGS = (
    "# YouTube Companion",
    "## Recommended Package",
    "## Hook Options",
    "## Title Ideas",
    "## Thumbnail Direction",
    "## Chapter Timestamps",
    "## YouTube Description",
    "## Social Share",
    "## LinkedIn Post",
    "## Pinned Comment",
    "## Short Description",
    "## Upload Checklist",
)

PUBLICATION_GATES = (
    "[ADD YOUTUBE URL BEFORE GOING LIVE]",
    "[ADD ARTICLE URL BEFORE GOING LIVE]",
    "[ADD RESOURCE ZIP URL BEFORE GOING LIVE]",
)

CHAPTER_PATTERN = re.compile(
    r"^(?P<timestamp>(?:\d+:)?[0-5]?\d:[0-5]\d)\s+(?P<label>\S.*)$"
)
LOCAL_LINK_PATTERN = re.compile(r"\[[^\]]+\]\((?P<target>\.{1,2}/[^)#]+)(?:#[^)]+)?\)")


def section(markdown: str, heading: str) -> str:
    start = markdown.find(heading)
    if start < 0:
        return ""
    body_start = start + len(heading)
    next_heading = markdown.find("\n## ", body_start)
    return markdown[body_start:] if next_heading < 0 else markdown[body_start:next_heading]


def first_fenced_block(markdown_section: str) -> str:
    match = re.search(r"```(?:text)?\s*\n(?P<body>.*?)\n```", markdown_section, re.DOTALL)
    return match.group("body") if match else ""


def timestamp_seconds(timestamp: str) -> int:
    parts = [int(part) for part in timestamp.split(":")]
    if len(parts) == 2:
        minutes, seconds = parts
        return minutes * 60 + seconds
    hours, minutes, seconds = parts
    return hours * 3600 + minutes * 60 + seconds


def validate(path: Path) -> tuple[list[str], list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    gates: list[str] = []

    if not path.is_file():
        return [f"File not found: {path}"], warnings, gates

    markdown = path.read_text(encoding="utf-8")

    for heading in REQUIRED_HEADINGS:
        if heading not in markdown:
            errors.append(f"Missing required heading: {heading}")

    if "—" in markdown or "–" in markdown:
        errors.append("Use commas, periods, or hyphens instead of em or en dashes.")

    chapter_section = section(markdown, "## Chapter Timestamps")
    chapter_block = first_fenced_block(chapter_section)
    chapters: list[tuple[int, str, str]] = []

    if not chapter_block:
        errors.append("Chapter Timestamps needs a fenced text block.")
    else:
        for line_number, line in enumerate(chapter_block.splitlines(), start=1):
            line = line.strip()
            if not line:
                continue
            match = CHAPTER_PATTERN.match(line)
            if not match:
                errors.append(f"Invalid chapter line {line_number}: {line}")
                continue
            timestamp = match.group("timestamp")
            label = match.group("label").strip()
            chapters.append((timestamp_seconds(timestamp), timestamp, label))

    if chapters:
        if chapters[0][0] != 0:
            errors.append("The first chapter must start at 00:00.")
        for previous, current in zip(chapters, chapters[1:]):
            if current[0] <= previous[0]:
                errors.append(
                    f"Chapters are not strictly increasing: {previous[1]} then {current[1]}."
                )
            elif current[0] - previous[0] < 10:
                warnings.append(
                    f"Chapters are less than 10 seconds apart: {previous[1]} and {current[1]}."
                )
        if len(chapters) < 8:
            warnings.append(f"Only {len(chapters)} chapters found; long-form videos usually need 8 to 20.")
        elif len(chapters) > 24:
            warnings.append(f"{len(chapters)} chapters found; merge minor beats when possible.")
        for _, timestamp, label in chapters:
            if len(label) > 65:
                warnings.append(f"Chapter label is longer than 65 characters at {timestamp}.")

    description = first_fenced_block(section(markdown, "## YouTube Description"))
    if not description:
        errors.append("YouTube Description needs a fenced text block.")
    else:
        if "Chapters:" not in description:
            errors.append("YouTube Description must include a Chapters block.")
        if "Resources:" not in description:
            errors.append("YouTube Description must include a Resources block.")
        if re.search(r"(?:/Users/|file://|[A-Za-z]:\\Users\\)", description):
            errors.append("YouTube Description contains a local filesystem path.")

    for match in LOCAL_LINK_PATTERN.finditer(markdown):
        target = (path.parent / match.group("target")).resolve()
        if not target.exists():
            errors.append(f"Broken local link: {match.group('target')}")

    for gate in PUBLICATION_GATES:
        if gate in markdown:
            gates.append(gate)

    for marker in ("TODO", "TBD", "FIXME"):
        if re.search(rf"\b{marker}\b", markdown, re.IGNORECASE):
            errors.append(f"Unresolved generic marker: {marker}")

    return errors, warnings, gates


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("runbook", type=Path, help="Path to youtube.md")
    args = parser.parse_args()

    errors, warnings, gates = validate(args.runbook.resolve())

    print(f"Runbook: {args.runbook}")
    for item in gates:
        print(f"GATE: {item}")
    for item in warnings:
        print(f"WARNING: {item}")
    for item in errors:
        print(f"ERROR: {item}")

    if errors:
        print(f"FAIL: {len(errors)} error(s), {len(warnings)} warning(s)")
        return 1

    print(f"PASS: 0 errors, {len(warnings)} warning(s), {len(gates)} publication gate(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())

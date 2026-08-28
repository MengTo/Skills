#!/usr/bin/env python3
"""Validate a visual article with optional destination-specific policies."""

from __future__ import annotations

import argparse
import re
import struct
import sys
from pathlib import Path


IMAGE_RE = re.compile(r"!\[[^\]]*\]\(([^)]+)\)")
LINK_RE = re.compile(r"(?<!!)\[[^\]]+\]\(([^)]+)\)")
H2_RE = re.compile(r"(?m)^## ([^#\n].*)$")
WORD_RE = re.compile(r"\b[\w']+\b")


def clean_target(raw: str) -> str:
    target = raw.strip()
    if target.startswith("<") and target.endswith(">"):
        target = target[1:-1]
    return target.split("#", 1)[0].split("?", 1)[0]


def is_remote(target: str) -> bool:
    return target.startswith(("http://", "https://", "mailto:", "#"))


def is_resources_heading(heading: str) -> bool:
    return heading.strip().lower().startswith("resources")


def png_size(path: Path) -> tuple[int, int] | None:
    with path.open("rb") as handle:
        header = handle.read(24)
    if header.startswith(b"\x89PNG\r\n\x1a\n") and len(header) >= 24:
        return struct.unpack(">II", header[16:24])
    return None


def jpeg_size(path: Path) -> tuple[int, int] | None:
    with path.open("rb") as handle:
        if handle.read(2) != b"\xff\xd8":
            return None
        while True:
            marker_start = handle.read(1)
            if not marker_start:
                return None
            if marker_start != b"\xff":
                continue
            marker = handle.read(1)
            while marker == b"\xff":
                marker = handle.read(1)
            if marker in (b"\xd8", b"\xd9"):
                continue
            length_raw = handle.read(2)
            if len(length_raw) != 2:
                return None
            length = struct.unpack(">H", length_raw)[0]
            if marker and marker[0] in range(0xC0, 0xC4):
                data = handle.read(5)
                if len(data) != 5:
                    return None
                height, width = struct.unpack(">HH", data[1:5])
                return width, height
            handle.seek(length - 2, 1)


def image_size(path: Path) -> tuple[int, int] | None:
    return png_size(path) or jpeg_size(path)


def parse_ratio(value: str) -> float | None:
    if value.lower() == "any":
        return None
    try:
        width, height = value.split(":", 1)
        ratio = float(width) / float(height)
    except (ValueError, ZeroDivisionError) as error:
        raise argparse.ArgumentTypeError("Aspect ratio must be any or WIDTH:HEIGHT") from error
    if ratio <= 0:
        raise argparse.ArgumentTypeError("Aspect ratio must be positive")
    return ratio


def add_range_error(
    value: int, minimum: int | None, maximum: int | None, label: str, errors: list[str]
) -> None:
    if minimum is not None and value < minimum:
        errors.append(f"{label} is {value}; minimum is {minimum}.")
    if maximum is not None and value > maximum:
        errors.append(f"{label} is {value}; maximum is {maximum}.")


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("article", type=Path, help="Path to content.md")
    parser.add_argument("--min-sections", type=int)
    parser.add_argument("--max-sections", type=int)
    parser.add_argument("--min-words", type=int)
    parser.add_argument("--max-words", type=int)
    parser.add_argument(
        "--aspect-ratio", type=parse_ratio, default=None, metavar="WIDTH:HEIGHT|any"
    )
    parser.add_argument("--aspect-tolerance", type=float, default=0.025)
    parser.add_argument("--max-sections-per-image", type=int)
    parser.add_argument("--require-cover", action="store_true")
    parser.add_argument("--require-resources", action="store_true")
    parser.add_argument("--forbid-dashes", action="store_true")
    args = parser.parse_args(argv)
    for name in ("min_sections", "max_sections", "min_words", "max_words"):
        value = getattr(args, name)
        if value is not None and value < 0:
            parser.error(f"--{name.replace('_', '-')} must be zero or greater")
    if args.max_sections_per_image is not None and args.max_sections_per_image < 1:
        parser.error("--max-sections-per-image must be at least 1")
    if args.aspect_tolerance < 0:
        parser.error("--aspect-tolerance must be zero or greater")
    return args


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    article = args.article.expanduser().resolve()
    if not article.is_file():
        raise ValueError(f"Article does not exist: {article}")

    text = article.read_text(encoding="utf-8")
    article_dir = article.parent
    errors: list[str] = []
    warnings: list[str] = []
    first_line = next((line for line in text.splitlines() if line.strip()), "")
    if not first_line.startswith("# "):
        errors.append("The first non-empty line must be an H1 title.")
    if args.forbid_dashes and ("—" in text or "–" in text):
        errors.append("The article contains an em dash or en dash.")

    sections = list(H2_RE.finditer(text))
    add_range_error(len(sections), args.min_sections, args.max_sections, "H2 section count", errors)
    resources_last = bool(sections and is_resources_heading(sections[-1].group(1)))
    if args.require_resources and not resources_last:
        errors.append("The final H2 section must be Resources or Resources and downloads.")

    images = list(IMAGE_RE.finditer(text))
    first_h2_position = sections[0].start() if sections else len(text)
    if args.require_cover and not any(image.start() < first_h2_position for image in images):
        errors.append("Add a cover image between the title and first H2 section.")

    content_sections = sections[:-1] if resources_last else sections
    if args.max_sections_per_image:
        for start in range(0, len(content_sections), args.max_sections_per_image):
            group = content_sections[start : start + args.max_sections_per_image]
            segment_start = group[0].start()
            next_index = start + len(group)
            segment_end = (
                content_sections[next_index].start()
                if next_index < len(content_sections)
                else (sections[-1].start() if resources_last else len(text))
            )
            if not IMAGE_RE.search(text[segment_start:segment_end]):
                names = ", ".join(section.group(1) for section in group)
                errors.append(f"Missing a visual within the section group: {names}")

    for match in images:
        target = clean_target(match.group(1))
        if is_remote(target):
            continue
        path = (article_dir / target).resolve()
        if not path.is_file():
            errors.append(f"Missing image file: {target}")
            continue
        if args.aspect_ratio is not None:
            size = image_size(path)
            if size is None:
                errors.append(f"Could not read image dimensions: {target}")
                continue
            width, height = size
            if abs(width / height - args.aspect_ratio) > args.aspect_tolerance:
                errors.append(f"Image has the wrong aspect ratio: {target} ({width}x{height})")

    for match in LINK_RE.finditer(text):
        target = clean_target(match.group(1))
        if is_remote(target) or not target:
            continue
        if not (article_dir / target).resolve().exists():
            errors.append(f"Missing linked local resource: {target}")

    if resources_last:
        resource_text = text[sections[-1].end() :]
        without_markdown_links = LINK_RE.sub("", resource_text)
        if re.search(r"https?://\S+", without_markdown_links):
            errors.append("Resources contains a bare URL instead of clickable Markdown.")

    prose = re.sub(r"```.*?```", "", text, flags=re.DOTALL)
    prose = IMAGE_RE.sub("", prose)
    word_count = len(WORD_RE.findall(prose))
    add_range_error(word_count, args.min_words, args.max_words, "Word count", errors)

    print(f"Article: {article}")
    print(f"H2 sections: {len(sections)}")
    print(f"Images: {len(images)}")
    print(f"Words: {word_count}")
    for warning in warnings:
        print(f"WARNING: {warning}")
    for error in errors:
        print(f"ERROR: {error}")
    if errors:
        print(f"FAIL: {len(errors)} error(s), {len(warnings)} warning(s)")
        return 1
    print(f"PASS: 0 errors, {len(warnings)} warning(s)")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError) as error:
        print(f"error: {error}", file=sys.stderr)
        raise SystemExit(2) from error

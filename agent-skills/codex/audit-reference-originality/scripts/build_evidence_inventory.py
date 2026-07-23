#!/usr/bin/env python3
"""Build deterministic originality-audit leads from a site and references."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable


TEXT_EXTENSIONS = {
    ".css",
    ".csv",
    ".htm",
    ".html",
    ".js",
    ".json",
    ".jsonl",
    ".jsx",
    ".md",
    ".mdx",
    ".scss",
    ".svg",
    ".toml",
    ".ts",
    ".tsx",
    ".txt",
    ".xml",
    ".yaml",
    ".yml",
}
IMAGE_EXTENSIONS = {
    ".avif",
    ".bmp",
    ".gif",
    ".jpeg",
    ".jpg",
    ".png",
    ".svg",
    ".tif",
    ".tiff",
    ".webp",
}
VIDEO_EXTENSIONS = {".avi", ".m4v", ".mov", ".mp4", ".mpeg", ".mpg", ".webm"}
SKIP_DIRECTORIES = {
    ".git",
    ".next",
    ".turbo",
    ".wrangler",
    "__pycache__",
    "build",
    "coverage",
    "dist",
    "node_modules",
}
MAX_TEXT_BYTES = 2_000_000
SHINGLE_SIZE = 8
NUMBER_PATTERN = re.compile(
    r"(?<![\w.])(?:[$€£¥]\s*)?\d[\d,.]*(?:\s?%|\s?(?:ms|sec|secs|seconds|minutes|hours|days|weeks|months|years|k|m|b))?(?![\w.])",
    re.IGNORECASE,
)
TOKEN_PATTERN = re.compile(r"[\w€£¥$%]+(?:['’.-][\w€£¥$%]+)*", re.UNICODE)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Inventory exact files, text overlap, number reuse, and Git-history matches."
    )
    parser.add_argument("--site", required=True, type=Path, help="Site project root")
    parser.add_argument(
        "--reference",
        required=True,
        action="append",
        type=Path,
        help="Reference file or directory; repeat as needed",
    )
    parser.add_argument("--output", type=Path, help="Write JSON to this path")
    parser.add_argument(
        "--no-history",
        action="store_true",
        help="Skip the Git-history blob check",
    )
    return parser.parse_args()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def classify(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix in VIDEO_EXTENSIONS:
        return "video"
    if suffix in IMAGE_EXTENSIONS:
        return "image"
    if suffix in TEXT_EXTENSIONS:
        return "text"
    return "asset"


def iter_files(targets: Iterable[Path]) -> list[Path]:
    found: list[Path] = []
    for target in targets:
        resolved = target.expanduser().resolve()
        if not resolved.exists():
            raise FileNotFoundError(f"Missing input: {resolved}")
        if resolved.is_file():
            found.append(resolved)
            continue
        for path in resolved.rglob("*"):
            if not path.is_file():
                continue
            if any(part in SKIP_DIRECTORIES for part in path.parts):
                continue
            if path.name == ".DS_Store":
                continue
            found.append(path)
    return sorted(set(found))


def relative_label(path: Path, roots: list[Path]) -> str:
    for root in roots:
        resolved = root.expanduser().resolve()
        if resolved.is_file():
            if path == resolved:
                return resolved.name
            continue
        try:
            return f"{resolved.name}/{path.relative_to(resolved)}"
        except ValueError:
            continue
    return str(path)


def file_record(path: Path, roots: list[Path]) -> dict[str, object]:
    return {
        "path": relative_label(path, roots),
        "bytes": path.stat().st_size,
        "sha256": sha256(path),
        "category": classify(path),
    }


def read_text(path: Path) -> str | None:
    if path.suffix.lower() not in TEXT_EXTENSIONS:
        return None
    if path.stat().st_size > MAX_TEXT_BYTES:
        return None
    try:
        return path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return None


def normalized_tokens(text: str) -> list[str]:
    return [match.group(0).lower() for match in TOKEN_PATTERN.finditer(text)]


def shingles(tokens: list[str]) -> set[str]:
    if len(tokens) < SHINGLE_SIZE:
        return set()
    return {
        " ".join(tokens[index : index + SHINGLE_SIZE])
        for index in range(len(tokens) - SHINGLE_SIZE + 1)
    }


def text_overlap(
    site_files: list[Path],
    reference_files: list[Path],
    site_roots: list[Path],
    reference_roots: list[Path],
) -> tuple[list[dict[str, object]], list[dict[str, object]]]:
    reference_index: dict[str, set[str]] = defaultdict(set)
    reference_counts: dict[str, int] = {}
    reference_numbers: dict[str, set[str]] = {}

    for path in reference_files:
        text = read_text(path)
        if text is None:
            continue
        label = relative_label(path, reference_roots)
        file_shingles = shingles(normalized_tokens(text))
        reference_counts[label] = len(file_shingles)
        reference_numbers[label] = {
            match.group(0).strip().lower() for match in NUMBER_PATTERN.finditer(text)
        }
        for shingle in file_shingles:
            reference_index[shingle].add(label)

    overlaps: list[dict[str, object]] = []
    number_overlaps: list[dict[str, object]] = []

    for path in site_files:
        text = read_text(path)
        if text is None:
            continue
        site_label = relative_label(path, site_roots)
        site_shingles = shingles(normalized_tokens(text))
        matches: Counter[str] = Counter()
        examples: dict[str, list[str]] = defaultdict(list)
        for shingle in site_shingles:
            for reference_label in reference_index.get(shingle, ()):
                matches[reference_label] += 1
                if len(examples[reference_label]) < 3:
                    examples[reference_label].append(shingle)
        for reference_label, shared in matches.items():
            if shared < 3:
                continue
            site_ratio = shared / max(1, len(site_shingles))
            reference_ratio = shared / max(1, reference_counts.get(reference_label, 0))
            if max(site_ratio, reference_ratio) < 0.12:
                continue
            overlaps.append(
                {
                    "site_path": site_label,
                    "reference_path": reference_label,
                    "shared_8_word_sequences": shared,
                    "site_containment": round(site_ratio, 4),
                    "reference_containment": round(reference_ratio, 4),
                    "examples": sorted(examples[reference_label]),
                }
            )

        site_numbers = {
            match.group(0).strip().lower() for match in NUMBER_PATTERN.finditer(text)
        }
        for reference_label, values in reference_numbers.items():
            shared_values = sorted(site_numbers & values)
            if shared_values:
                number_overlaps.append(
                    {
                        "site_path": site_label,
                        "reference_path": reference_label,
                        "values": shared_values[:50],
                    }
                )

    overlaps.sort(
        key=lambda item: (
            -int(item["shared_8_word_sequences"]),
            str(item["site_path"]),
            str(item["reference_path"]),
        )
    )
    number_overlaps.sort(key=lambda item: (str(item["site_path"]), str(item["reference_path"])))
    return overlaps, number_overlaps


def exact_matches(
    site_records: list[dict[str, object]],
    reference_records: list[dict[str, object]],
) -> list[dict[str, object]]:
    by_hash: dict[str, list[dict[str, object]]] = defaultdict(list)
    for record in reference_records:
        by_hash[str(record["sha256"])].append(record)
    matches: list[dict[str, object]] = []
    for site_record in site_records:
        for reference_record in by_hash.get(str(site_record["sha256"]), []):
            matches.append(
                {
                    "site_path": site_record["path"],
                    "reference_path": reference_record["path"],
                    "sha256": site_record["sha256"],
                    "category": site_record["category"],
                    "bytes": site_record["bytes"],
                }
            )
    return matches


def basename_matches(
    site_files: list[Path],
    reference_files: list[Path],
    site_roots: list[Path],
    reference_roots: list[Path],
) -> list[dict[str, str]]:
    reference_names: dict[str, list[Path]] = defaultdict(list)
    for path in reference_files:
        reference_names[path.name.lower()].append(path)
    matches: list[dict[str, str]] = []
    for site_path in site_files:
        for reference_path in reference_names.get(site_path.name.lower(), []):
            matches.append(
                {
                    "site_path": relative_label(site_path, site_roots),
                    "reference_path": relative_label(reference_path, reference_roots),
                    "basename": site_path.name,
                }
            )
    return matches


def run_git(site_root: Path, args: list[str], input_bytes: bytes | None = None) -> bytes:
    return subprocess.check_output(
        ["git", "-C", str(site_root), *args],
        input=input_bytes,
        stderr=subprocess.DEVNULL,
    )


def git_history_matches(
    site_root: Path,
    reference_files: list[Path],
    reference_roots: list[Path],
) -> list[dict[str, object]]:
    try:
        run_git(site_root, ["rev-parse", "--is-inside-work-tree"])
        objects_output = run_git(site_root, ["rev-list", "--objects", "--all"]).decode(
            "utf-8", errors="replace"
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        return []

    historical_paths: dict[str, set[str]] = defaultdict(set)
    for line in objects_output.splitlines():
        oid, _, path = line.partition(" ")
        if path:
            historical_paths[oid].add(path)

    matches: list[dict[str, object]] = []
    for reference_path in reference_files:
        try:
            oid = run_git(
                site_root,
                ["hash-object", "--stdin"],
                input_bytes=reference_path.read_bytes(),
            ).decode("ascii").strip()
        except (OSError, subprocess.CalledProcessError):
            continue
        paths = sorted(historical_paths.get(oid, set()))
        if paths:
            matches.append(
                {
                    "reference_path": relative_label(reference_path, reference_roots),
                    "git_blob": oid,
                    "historical_site_paths": paths,
                }
            )
    return matches


def category_counts(records: list[dict[str, object]]) -> dict[str, int]:
    return dict(sorted(Counter(str(record["category"]) for record in records).items()))


def main() -> int:
    args = parse_args()
    site_root = args.site.expanduser().resolve()
    reference_roots = [path.expanduser().resolve() for path in args.reference]
    if not site_root.is_dir():
        print(f"Site root is not a directory: {site_root}", file=sys.stderr)
        return 2

    try:
        site_files = iter_files([site_root])
        reference_files = iter_files(reference_roots)
    except FileNotFoundError as error:
        print(str(error), file=sys.stderr)
        return 2

    site_records = [file_record(path, [site_root]) for path in site_files]
    reference_records = [
        file_record(path, reference_roots) for path in reference_files
    ]
    overlaps, number_overlaps = text_overlap(
        site_files,
        reference_files,
        [site_root],
        reference_roots,
    )
    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "site_root": str(site_root),
        "reference_roots": [str(path) for path in reference_roots],
        "summary": {
            "site_files": len(site_records),
            "reference_files": len(reference_records),
            "site_categories": category_counts(site_records),
            "reference_categories": category_counts(reference_records),
        },
        "exact_file_matches": exact_matches(site_records, reference_records),
        "historical_exact_matches": (
            []
            if args.no_history
            else git_history_matches(site_root, reference_files, reference_roots)
        ),
        "basename_matches": basename_matches(
            site_files,
            reference_files,
            [site_root],
            reference_roots,
        ),
        "text_overlap_leads": overlaps,
        "number_overlap_leads": number_overlaps,
        "notes": [
            "Leads are not automatic plagiarism findings.",
            "Review rendered context, licenses, visual composition, and video motion manually.",
            "Generic numbers and common functional phrases may be false positives.",
        ],
    }
    output = json.dumps(report, indent=2, ensure_ascii=False) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(output, encoding="utf-8")
    else:
        sys.stdout.write(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

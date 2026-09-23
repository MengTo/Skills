#!/usr/bin/env python3
"""Validate neutral final-video and editor-adapter lesson packages."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


IMAGE_RE = re.compile(r"!\[[^\]]*\]\(([^)]+)\)")
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
FORBIDDEN_MANIFEST_KEYS = {"article", "body", "content", "html", "markdown"}


def clean_target(raw: str) -> str:
    target = raw.strip()
    if target.startswith("<") and target.endswith(">"):
        target = target[1:-1]
    return target.split("#", 1)[0].split("?", 1)[0]


def find_forbidden_key(value: object, path: str = "manifest") -> str | None:
    if isinstance(value, dict):
        for key, child in value.items():
            if str(key).lower() in FORBIDDEN_MANIFEST_KEYS:
                return f"{path}.{key}"
            found = find_forbidden_key(child, f"{path}.{key}")
            if found:
                return found
    elif isinstance(value, list):
        for index, child in enumerate(value):
            found = find_forbidden_key(child, f"{path}[{index}]")
            if found:
                return found
    return None


def require_fields(value: object, fields: set[str], label: str, errors: list[str]) -> None:
    if not isinstance(value, dict):
        errors.append(f"{label} must be an object")
        return
    missing = sorted(field for field in fields if field not in value)
    if missing:
        errors.append(f"{label} is missing: {', '.join(missing)}")


def validate_package(package_dir: Path) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    content_path = package_dir / "content.md"
    manifest_path = package_dir / "manifest.json"
    transcript_path = package_dir / "transcript.txt"
    images_dir = package_dir / "images"
    for required in (content_path, manifest_path, transcript_path):
        if not required.is_file():
            errors.append(f"Missing required file: {required.name}")
    if not images_dir.is_dir():
        errors.append("Missing required directory: images")
    if errors:
        return errors, warnings

    content = content_path.read_text(encoding="utf-8")
    first_line = next((line for line in content.splitlines() if line.strip()), "")
    if not first_line.startswith("# "):
        errors.append("content.md must begin with a non-empty H1")
    if not transcript_path.read_text(encoding="utf-8").strip():
        errors.append("transcript.txt must not be empty")
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        errors.append(f"manifest.json is invalid JSON: {error}")
        return errors, warnings
    if not isinstance(manifest, dict):
        errors.append("manifest.json must contain an object")
        return errors, warnings

    forbidden = find_forbidden_key(manifest)
    if forbidden:
        errors.append(f"Manifest must not contain article text fields: {forbidden}")
    require_fields(manifest.get("course"), {"title", "slug"}, "course", errors)
    require_fields(manifest.get("lesson"), {"number", "title", "slug"}, "lesson", errors)

    images = manifest.get("images")
    if not isinstance(images, list) or not images or not all(isinstance(item, str) for item in images):
        errors.append("images must be a non-empty ordered array of paths")
        images = []
    markdown_images = [clean_target(match.group(1)) for match in IMAGE_RE.finditer(content)]
    if markdown_images != images:
        errors.append("Markdown image order must exactly match manifest images")
    for relative in images:
        image_path = Path(relative)
        if image_path.is_absolute() or ".." in image_path.parts:
            errors.append(f"Image path must stay inside the package: {relative}")
            continue
        if not (package_dir / image_path).is_file():
            errors.append(f"Missing manifest image: {relative}")

    captures = manifest.get("captures")
    if not isinstance(captures, list) or len(captures) != len(images):
        errors.append("captures must contain one provenance record per image")
        captures = []
    else:
        capture_images = [item.get("image") if isinstance(item, dict) else None for item in captures]
        if capture_images != images:
            errors.append("Capture image order must exactly match manifest images")

    source_method = manifest.get("sourceMethod")
    if source_method == "final-video":
        source_video = manifest.get("sourceVideo")
        require_fields(
            source_video,
            {"path", "sha256", "bytes", "durationSeconds", "width", "height", "frameRate", "hasAudio"},
            "sourceVideo",
            errors,
        )
        if isinstance(source_video, dict) and not SHA256_RE.fullmatch(str(source_video.get("sha256", ""))):
            errors.append("sourceVideo.sha256 must be a lowercase SHA-256")
        transcript_source = manifest.get("transcriptSource")
        if not isinstance(transcript_source, str) or not transcript_source.strip():
            errors.append("transcriptSource must be a non-empty source identity")
        for index, capture in enumerate(captures):
            require_fields(
                capture,
                {"image", "brief", "videoSeconds", "sourceTimestamp", "captureMethod"},
                f"captures[{index}]",
                errors,
            )
            if isinstance(capture, dict) and capture.get("captureMethod") != "direct-final-master-frame":
                errors.append(f"captures[{index}] must declare direct-final-master-frame")
    elif source_method == "editor-project":
        require_fields(manifest.get("editorAdapter"), {"name", "version"}, "editorAdapter", errors)
        editor_project = manifest.get("editorProject")
        if not isinstance(editor_project, str) or not editor_project.strip():
            errors.append("editorProject must be a non-empty path or stable identity")
        for index, capture in enumerate(captures):
            require_fields(
                capture,
                {
                    "image",
                    "brief",
                    "requestedTimelineSeconds",
                    "mappedSourceSeconds",
                    "captureMethod",
                    "includedEffects",
                    "excludedEffects",
                },
                f"captures[{index}]",
                errors,
            )
    else:
        errors.append("sourceMethod must be final-video or editor-project")

    referenced = {str(Path(item)) for item in images}
    extras = sorted(
        str(path.relative_to(package_dir))
        for path in images_dir.rglob("*")
        if path.is_file() and str(path.relative_to(package_dir)) not in referenced
    )
    if extras:
        warnings.append(f"Unreferenced image files: {', '.join(extras)}")
    return errors, warnings


def discover_packages(paths: list[Path]) -> list[Path]:
    packages: list[Path] = []
    for raw in paths:
        path = raw.expanduser().resolve()
        if path.is_file() and path.name in {"content.md", "manifest.json"}:
            path = path.parent
        if not path.is_dir():
            raise ValueError(f"Package path does not exist: {path}")
        if (path / "manifest.json").is_file():
            packages.append(path)
        else:
            packages.extend(sorted(item.parent for item in path.rglob("manifest.json")))
    unique = list(dict.fromkeys(packages))
    if not unique:
        raise ValueError("No lesson packages found")
    return unique


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("packages", nargs="+", type=Path)
    args = parser.parse_args(argv or sys.argv[1:])
    failed = False
    for package in discover_packages(args.packages):
        errors, warnings = validate_package(package)
        print(f"Package: {package}")
        for warning in warnings:
            print(f"WARNING: {warning}")
        for error in errors:
            print(f"ERROR: {error}")
        if errors:
            failed = True
            print(f"FAIL: {len(errors)} error(s), {len(warnings)} warning(s)")
        else:
            print(f"PASS: 0 errors, {len(warnings)} warning(s)")
    return 1 if failed else 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError) as error:
        print(f"error: {error}", file=sys.stderr)
        raise SystemExit(2) from error

#!/usr/bin/env python3
"""Inspect video exports and optionally test them against supplied profiles."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path


def orientation(width: int, height: int) -> str:
    if width == height:
        return "square"
    return "landscape" if width > height else "portrait"


def parse_ratio(value: str) -> float:
    try:
        width, height = value.split(":", 1)
        ratio = float(width) / float(height)
    except (ValueError, ZeroDivisionError) as error:
        raise ValueError(f"Invalid aspect ratio {value!r}; expected WIDTH:HEIGHT") from error
    if ratio <= 0:
        raise ValueError(f"Invalid aspect ratio {value!r}; values must be positive")
    return ratio


def evaluate_profile(record: dict[str, object], profile: dict[str, object]) -> dict[str, object]:
    name = profile.get("name")
    if not isinstance(name, str) or not name.strip():
        raise ValueError("Every profile needs a non-empty name")
    issues: list[str] = []
    allowed_orientations = profile.get("allowedOrientations")
    if allowed_orientations is not None:
        if not isinstance(allowed_orientations, list) or not all(
            item in {"landscape", "portrait", "square"} for item in allowed_orientations
        ):
            raise ValueError(f"Profile {name} has invalid allowedOrientations")
        if record["orientation"] not in allowed_orientations:
            issues.append(f"orientation {record['orientation']} is not allowed")

    allowed_ratios = profile.get("allowedAspectRatios")
    if allowed_ratios is not None:
        if not isinstance(allowed_ratios, list) or not all(
            isinstance(item, str) for item in allowed_ratios
        ):
            raise ValueError(f"Profile {name} has invalid allowedAspectRatios")
        tolerance = float(profile.get("aspectTolerance", 0.03))
        if not any(
            abs(float(record["aspectRatio"]) - parse_ratio(item)) <= tolerance
            for item in allowed_ratios
        ):
            issues.append(f"aspect ratio {record['displayAspectRatio']} is not allowed")

    numeric_rules = {
        "minWidth": ("width", "at least"),
        "maxWidth": ("width", "at most"),
        "minHeight": ("height", "at least"),
        "maxHeight": ("height", "at most"),
        "minDurationSeconds": ("durationSeconds", "at least"),
        "maxDurationSeconds": ("durationSeconds", "at most"),
    }
    for rule, (field, phrase) in numeric_rules.items():
        if rule not in profile:
            continue
        limit = float(profile[rule])
        actual = float(record[field])
        if rule.startswith("min") and actual < limit:
            issues.append(f"{field} {actual:g} must be {phrase} {limit:g}")
        if rule.startswith("max") and actual > limit:
            issues.append(f"{field} {actual:g} must be {phrase} {limit:g}")
    if profile.get("requireAudio") is True and not record["hasAudio"]:
        issues.append("an audio stream is required")
    return {"name": name, "matches": not issues, "issues": issues}


def load_profiles(path: Path | None) -> list[dict[str, object]]:
    if path is None:
        return []
    payload = json.loads(path.read_text(encoding="utf-8"))
    profiles = payload.get("profiles") if isinstance(payload, dict) else None
    if not isinstance(profiles, list) or not profiles or not all(
        isinstance(item, dict) for item in profiles
    ):
        raise ValueError("Profile file must contain a non-empty profiles array")
    return profiles


def probe(path: Path, profiles: list[dict[str, object]]) -> dict[str, object]:
    command = [
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "stream=codec_type,codec_name,width,height,display_aspect_ratio,avg_frame_rate:format=duration,format_name",
        "-of",
        "json",
        str(path),
    ]
    result = subprocess.run(command, check=True, capture_output=True, text=True)
    payload = json.loads(result.stdout)
    streams = payload.get("streams", [])
    stream = next((item for item in streams if item.get("codec_type") == "video"), None)
    if stream is None:
        raise ValueError(f"No video stream found in {path}")
    width = int(stream["width"])
    height = int(stream["height"])
    duration = round(float(payload.get("format", {}).get("duration", 0)), 3)
    record: dict[str, object] = {
        "file": str(path.resolve()),
        "bytes": path.stat().st_size,
        "width": width,
        "height": height,
        "displayAspectRatio": stream.get("display_aspect_ratio") or f"{width}:{height}",
        "aspectRatio": round(width / height, 6),
        "orientation": orientation(width, height),
        "durationSeconds": duration,
        "frameRate": stream.get("avg_frame_rate"),
        "videoCodec": stream.get("codec_name"),
        "audioCodecs": [
            item.get("codec_name") for item in streams if item.get("codec_type") == "audio"
        ],
        "hasAudio": any(item.get("codec_type") == "audio" for item in streams),
        "container": payload.get("format", {}).get("format_name"),
    }
    if profiles:
        record["profileResults"] = [evaluate_profile(record, profile) for profile in profiles]
    return record


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("videos", nargs="+", type=Path)
    parser.add_argument(
        "--profiles", type=Path, help="JSON profile rules verified against current channel docs"
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    if not shutil.which("ffprobe"):
        raise ValueError("ffprobe is required")
    profile_path = args.profiles.expanduser().resolve() if args.profiles else None
    if profile_path and not profile_path.is_file():
        raise ValueError(f"Profile file does not exist: {profile_path}")
    profiles = load_profiles(profile_path)
    records = []
    for raw in args.videos:
        path = raw.expanduser().resolve()
        if not path.is_file():
            raise ValueError(f"Video file does not exist: {path}")
        records.append(probe(path, profiles))
    print(json.dumps(records, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, json.JSONDecodeError, subprocess.CalledProcessError) as error:
        detail = error.stderr.strip() if isinstance(error, subprocess.CalledProcessError) else str(error)
        print(f"error: {detail}", file=sys.stderr)
        raise SystemExit(2) from error

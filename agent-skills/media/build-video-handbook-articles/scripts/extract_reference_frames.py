#!/usr/bin/env python3
"""Extract clean 16:9 reference frames from a source video."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path


def run(command: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, check=True, text=True, capture_output=True)


def parse_timestamp(value: str) -> float:
    parts = value.strip().split(":")
    try:
        if len(parts) == 1:
            return float(parts[0])
        if len(parts) == 2:
            minutes, seconds = parts
            return float(minutes) * 60 + float(seconds)
        if len(parts) == 3:
            hours, minutes, seconds = parts
            return float(hours) * 3600 + float(minutes) * 60 + float(seconds)
    except ValueError as exc:
        raise argparse.ArgumentTypeError(f"Invalid timestamp: {value}") from exc
    raise argparse.ArgumentTypeError(f"Invalid timestamp: {value}")


def probe_duration(video: Path) -> float:
    result = run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(video),
        ]
    )
    return float(result.stdout.strip())


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("video", type=Path)
    parser.add_argument("output_dir", type=Path)
    parser.add_argument("--timestamps", help="Comma-separated seconds, MM:SS, or HH:MM:SS")
    parser.add_argument("--count", type=int, default=8, help="Evenly spaced frames when timestamps are omitted")
    parser.add_argument("--width", type=int, default=1600)
    parser.add_argument("--height", type=int, default=900)
    args = parser.parse_args()

    if not args.video.is_file():
        parser.error(f"Video does not exist: {args.video}")
    if args.count < 1:
        parser.error("--count must be at least 1")
    for tool in ("ffmpeg", "ffprobe"):
        if not shutil.which(tool):
            parser.error(f"Required tool is missing: {tool}")

    duration = probe_duration(args.video)
    if args.timestamps:
        timestamps = [parse_timestamp(value) for value in args.timestamps.split(",")]
    else:
        step = duration / (args.count + 1)
        timestamps = [step * index for index in range(1, args.count + 1)]

    invalid = [value for value in timestamps if value < 0 or value >= duration]
    if invalid:
        parser.error(f"Timestamps outside the video duration ({duration:.2f}s): {invalid}")

    args.output_dir.mkdir(parents=True, exist_ok=True)
    scale = (
        f"scale={args.width}:{args.height}:force_original_aspect_ratio=decrease,"
        f"pad={args.width}:{args.height}:(ow-iw)/2:(oh-ih)/2"
    )
    frames = []
    for timestamp in timestamps:
        seconds = int(round(timestamp))
        output = args.output_dir / f"source-{seconds:04d}s-{args.width}x{args.height}.jpg"
        run(
            [
                "ffmpeg",
                "-loglevel",
                "error",
                "-y",
                "-ss",
                f"{timestamp:.3f}",
                "-i",
                str(args.video),
                "-frames:v",
                "1",
                "-vf",
                scale,
                "-q:v",
                "2",
                str(output),
            ]
        )
        frames.append({"timestamp_seconds": round(timestamp, 3), "path": str(output)})
        print(output)

    manifest = {
        "source_video": str(args.video.resolve()),
        "duration_seconds": round(duration, 3),
        "dimensions": f"{args.width}x{args.height}",
        "frames": frames,
    }
    manifest_path = args.output_dir / "frames.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(manifest_path)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except subprocess.CalledProcessError as error:
        print(error.stderr or str(error), file=sys.stderr)
        raise SystemExit(error.returncode)

#!/usr/bin/env python3
"""Inspect video dimensions and map them to the social distribution matrix."""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path


def probe(path: Path) -> dict:
    command = [
        "ffprobe",
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height,avg_frame_rate:format=duration",
        "-of",
        "json",
        str(path),
    ]
    result = subprocess.run(command, check=True, capture_output=True, text=True)
    payload = json.loads(result.stdout)
    stream = payload["streams"][0]
    width = int(stream["width"])
    height = int(stream["height"])
    ratio = width / height

    if abs(ratio - 4 / 3) < 0.03:
        destination = "X, LinkedIn, Threads"
        expected_captions = "burned in"
    elif abs(ratio - 9 / 16) < 0.03:
        destination = "Instagram"
        expected_captions = "burned in"
    elif abs(ratio - 16 / 9) < 0.03:
        destination = "YouTube"
        expected_captions = "not burned in"
    else:
        destination = "unclassified"
        expected_captions = "review manually"

    return {
        "file": str(path.resolve()),
        "width": width,
        "height": height,
        "aspect_ratio": round(ratio, 4),
        "duration_seconds": round(float(payload["format"]["duration"]), 2),
        "frame_rate": stream.get("avg_frame_rate"),
        "destination": destination,
        "expected_captions": expected_captions,
        "caption_visual_check_required": True,
    }


def main() -> int:
    if not shutil.which("ffprobe"):
        print("ffprobe is required", file=sys.stderr)
        return 2
    if len(sys.argv) < 2:
        print(f"Usage: {Path(sys.argv[0]).name} VIDEO [VIDEO ...]", file=sys.stderr)
        return 2

    records = []
    for raw in sys.argv[1:]:
        path = Path(raw).expanduser()
        if not path.is_file():
            print(f"Missing file: {path}", file=sys.stderr)
            return 2
        records.append(probe(path))

    print(json.dumps(records, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

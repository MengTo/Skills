#!/usr/bin/env python3
"""Encode and validate an optimized 10-second 720p30 VP9 preview."""

from __future__ import annotations

import argparse
from fractions import Fraction
import json
from pathlib import Path
import subprocess


def run(command: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, check=True, text=True, capture_output=True)


def probe(path: Path) -> dict:
    result = run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "stream=codec_name,width,height,r_frame_rate,pix_fmt",
            "-show_entries",
            "format=duration,size",
            "-of",
            "json",
            str(path),
        ]
    )
    return json.loads(result.stdout)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--crf", type=int, default=36)
    parser.add_argument("--expected-duration", type=float, default=10.0)
    parser.add_argument("--expected-fps", type=Fraction, default=Fraction(30, 1))
    parser.add_argument("--width", type=int, default=1280)
    parser.add_argument("--height", type=int, default=720)
    args = parser.parse_args()

    if not args.input.is_file():
        raise FileNotFoundError(args.input)
    args.output.parent.mkdir(parents=True, exist_ok=True)

    subprocess.run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(args.input),
            "-map",
            "0:v:0",
            "-an",
            "-c:v",
            "libvpx-vp9",
            "-crf",
            str(args.crf),
            "-b:v",
            "0",
            "-row-mt",
            "1",
            "-tile-columns",
            "2",
            "-frame-parallel",
            "1",
            "-g",
            "120",
            "-threads",
            "8",
            "-deadline",
            "good",
            "-cpu-used",
            "3",
            "-pix_fmt",
            "yuv420p",
            "-map_metadata",
            "-1",
            str(args.output),
        ],
        check=True,
    )

    metadata = probe(args.output)
    stream = metadata["streams"][0]
    duration = float(metadata["format"]["duration"])
    fps = Fraction(stream["r_frame_rate"])
    expected = {
        "codec_name": "vp9",
        "width": args.width,
        "height": args.height,
        "pix_fmt": "yuv420p",
    }
    actual = {key: stream[key] for key in expected}
    if actual != expected:
        raise RuntimeError(f"Unexpected stream metadata: {actual}")
    if fps != args.expected_fps:
        raise RuntimeError(f"Unexpected frame rate: {fps}")
    if abs(duration - args.expected_duration) > 0.01:
        raise RuntimeError(f"Unexpected duration: {duration}")

    output_size = args.output.stat().st_size
    print(
        json.dumps(
            {
                "output": str(args.output),
                "bytes": output_size,
                "duration": duration,
                "fps": str(fps),
                "width": stream["width"],
                "height": stream["height"],
                "codec": stream["codec_name"],
                "crf": args.crf,
            },
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

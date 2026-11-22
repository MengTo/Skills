#!/usr/bin/env python3
"""Decode a UHD/60 MP4, check its presentation clock and identify the exact upload."""
import argparse
import hashlib
import json
from fractions import Fraction
from pathlib import Path
import subprocess
import sys


def has_fast_start(path):
    """Read top-level MP4 boxes without loading the video payload into memory."""
    end = path.stat().st_size
    with path.open("rb") as source:
        while source.tell() + 8 <= end:
            start = source.tell()
            size = int.from_bytes(source.read(4), "big")
            kind = source.read(4)
            if size == 1:
                size = int.from_bytes(source.read(8), "big")
            elif size == 0:
                size = end - start
            if size < source.tell() - start or start + size > end:
                raise ValueError("Invalid MP4 box size")
            if kind == b"moov":
                return True
            if kind == b"mdat":
                return False
            source.seek(start + size)
    return False


def inspect_master(path, ffprobe):
    command = [
        ffprobe, "-v", "error", "-select_streams", "V:0", "-show_frames",
        "-show_entries", "frame=best_effort_timestamp:stream=codec_name,pix_fmt,width,height,avg_frame_rate,time_base:format=format_name:format_tags=major_brand",
        "-of", "json", str(path.resolve()),
    ]
    probe = subprocess.run(command, capture_output=True, text=True, check=False)
    if probe.returncode or probe.stderr.strip():
        raise ValueError(probe.stderr.strip() or "ffprobe could not decode the master")
    data = json.loads(probe.stdout)
    container = data["format"]
    brand = container.get("tags", {}).get("major_brand", "").strip()
    if path.suffix.lower() != ".mp4" or "mp4" not in container["format_name"].split(",") or not brand or brand == "qt" or brand.startswith(("3g", "mj2")):
        raise ValueError("Expected an MP4 container and .mp4 filename")
    streams = data.get("streams", [])
    if not streams:
        raise ValueError("No video stream")
    stream = streams[0]
    if stream["codec_name"] != "h264" or stream["pix_fmt"] not in {"yuv420p", "yuvj420p"}:
        raise ValueError("Expected H.264 with 8-bit 4:2:0 chroma")
    if not has_fast_start(path):
        raise ValueError("Expected fast start (moov before mdat)")
    if (stream["width"], stream["height"]) != (3840, 2160):
        raise ValueError(f"Expected 3840 × 2160, got {stream['width']} × {stream['height']}")
    if Fraction(stream["avg_frame_rate"]) != 60:
        raise ValueError("Expected exactly 60 fps, got " + stream["avg_frame_rate"])
    frames = data.get("frames", [])
    if len(frames) < 2:
        raise ValueError("Too few decoded frames to measure cadence")
    # Compare to a rational 60 Hz clock. Container timestamps can round by one tick.
    ticks_per_frame = Fraction(1, 60) / Fraction(stream["time_base"])
    first = int(frames[0]["best_effort_timestamp"])
    previous = first - 1
    for index, frame in enumerate(frames):
        pts = int(frame["best_effort_timestamp"])
        if pts <= previous or abs(pts - first - index * ticks_per_frame) > 1:
            raise ValueError(f"Irregular presentation time at frame {index + 1}")
        previous = pts
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return dict(file=path.name, bytes=path.stat().st_size, sha256=digest.hexdigest(),
                codec=stream["codec_name"], pixel_format=stream["pix_fmt"], fast_start=True, width=3840, height=2160, fps=60,
                frames=len(frames), video_seconds=round(len(frames) / 60, 6))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("master", type=Path)
    parser.add_argument("--ffprobe", default="ffprobe", help="FFprobe executable")
    args = parser.parse_args()
    try:
        print(json.dumps(inspect_master(args.master, args.ffprobe), indent=2))
    except (OSError, ValueError, KeyError, ZeroDivisionError) as error:
        print(f"Master verification failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

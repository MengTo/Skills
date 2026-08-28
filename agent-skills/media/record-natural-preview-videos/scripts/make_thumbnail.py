#!/usr/bin/env python3
"""Create and validate a metadata-free 16:9 JPEG gallery thumbnail."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageOps


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--width", type=int, default=1280)
    parser.add_argument("--height", type=int, default=720)
    parser.add_argument("--quality", type=int, default=88)
    args = parser.parse_args()

    if not args.input.is_file():
        raise FileNotFoundError(args.input)
    if args.width <= 0 or args.height <= 0:
        raise ValueError("Thumbnail dimensions must be positive")
    if not 1 <= args.quality <= 95:
        raise ValueError("JPEG quality must be between 1 and 95")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(args.input) as source:
        frame = ImageOps.exif_transpose(source).convert("RGB")
        thumbnail = ImageOps.fit(
            frame,
            (args.width, args.height),
            method=Image.Resampling.LANCZOS,
            centering=(0.5, 0.5),
        )
        thumbnail.save(
            args.output,
            format="JPEG",
            quality=args.quality,
            optimize=True,
            progressive=True,
            subsampling=2,
            exif=b"",
        )

    with Image.open(args.output) as result:
        if result.format != "JPEG" or result.size != (args.width, args.height):
            raise RuntimeError(
                f"Unexpected thumbnail output: format={result.format} size={result.size}"
            )

    print(f"{args.output}\t{args.output.stat().st_size} bytes\t{args.width}x{args.height}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

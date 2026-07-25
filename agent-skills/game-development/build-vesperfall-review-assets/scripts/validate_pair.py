#!/usr/bin/env python3
"""Validate a Vesperfall catalog PNG and its declared local model source."""

from __future__ import annotations

import argparse
import pathlib
import struct
import sys


PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("png", type=pathlib.Path)
    parser.add_argument("model_source", type=pathlib.Path)
    parser.add_argument("--size", type=int, default=512)
    args = parser.parse_args()

    if not args.png.is_file():
        raise SystemExit(f"missing PNG: {args.png}")
    if not args.model_source.is_file():
        raise SystemExit(f"missing model source: {args.model_source}")

    data = args.png.read_bytes()
    if data[:8] != PNG_SIGNATURE:
        raise SystemExit(f"not a PNG: {args.png}")
    width, height = struct.unpack(">II", data[16:24])
    color_type = data[25]
    if (width, height) != (args.size, args.size):
        raise SystemExit(f"expected {args.size}x{args.size}, received {width}x{height}")
    if color_type not in (4, 6):
        raise SystemExit(f"PNG lacks alpha-compatible color type: {color_type}")
    if args.model_source.suffix.lower() not in {".fbx", ".glb", ".gltf", ".ts", ".tsx"}:
        raise SystemExit(f"unsupported model source: {args.model_source}")

    print(
        f"ok png={args.png} size={width}x{height} alpha_type={color_type} "
        f"model={args.model_source}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

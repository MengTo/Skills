#!/usr/bin/env python3
"""Report PNG metadata and real alpha coverage without modifying the file."""

import argparse
import hashlib
import json
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required. Run this helper in a Python environment with Pillow installed.")


def inspect_png(path):
    with Image.open(path) as source:
        if source.format != "PNG":
            raise ValueError(f"Expected PNG; found {source.format or 'unknown format'}")
        if getattr(source, "n_frames", 1) != 1:
            raise ValueError("Expected a static PNG; animated PNG inspection is unsupported")
        source.load()
        # Conversion is in memory only and also resolves palette-based transparency.
        alpha = source.convert("RGBA").getchannel("A")
        histogram = alpha.histogram()
        pixels = source.width * source.height
        transparent = histogram[0]
        opaque = histogram[255]
        partial = pixels - transparent - opaque
        payload = path.read_bytes()
        return {
            "path": str(path.resolve()),
            "format": source.format,
            "mode": source.mode,
            "width": source.width,
            "height": source.height,
            "bytes": len(payload),
            "sha256": hashlib.sha256(payload).hexdigest(),
            "alpha_range": list(alpha.getextrema()),
            "transparent_percent": round(100 * transparent / pixels, 4),
            "partial_percent": round(100 * partial / pixels, 4),
            "opaque_percent": round(100 * opaque / pixels, 4),
            "visible_bounds": alpha.getbbox(),
            "has_transparency": opaque < pixels,
            "has_visible_pixels": transparent < pixels,
        }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--require-transparency", action="store_true",
                        help="Fail if a PNG is fully opaque or entirely invisible.")
    parser.add_argument("paths", nargs="+", type=Path)
    args = parser.parse_args()
    results = []
    failed = False
    for path in args.paths:
        try:
            result = inspect_png(path)
            result["ok"] = True
            if args.require_transparency and not (
                result["has_transparency"] and result["has_visible_pixels"]
            ):
                result["ok"] = False
                result["error"] = "Expected both transparency and visible artwork"
        except (OSError, ValueError, Image.DecompressionBombError) as error:
            result = {"path": str(path), "ok": False, "error": str(error)}
        results.append(result)
        failed = failed or not result["ok"]
    print(json.dumps(results, indent=2))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())

"""Extract dark marks from an evenly spaced grid of logos on white paper."""
import argparse
import json
import re
from pathlib import Path
from PIL import Image, ImageOps


def extract(sheet, names, columns, rows):
    width, height = sheet.size
    for index, name in enumerate(names):
        row, column = divmod(index, columns)
        cell = sheet.crop((column * width // columns, row * height // rows,
                           (column + 1) * width // columns, (row + 1) * height // rows))
        ink = cell.point(lambda p: 255 if p < 135 else 0).getbbox()
        if not ink:
            raise ValueError(f"{name} has no ink. Check the grid and reading order.")
        left, top, right, bottom = ink
        if left == 0 or top == 0 or right == cell.width or bottom == cell.height:
            raise ValueError(f"{name} touches a grid boundary. Inspect its position.")
        gray = cell.crop((max(0, left - 5), max(0, top - 5),
                          min(cell.width, right + 5), min(cell.height, bottom + 5)))
        alpha = gray.point(lambda p: min(255, max(0, round((248 - p) * 255 / 234))))
        mark = Image.new("RGBA", gray.size, (20, 20, 20))
        mark.putalpha(alpha)
        yield name, mark


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("sheet", type=Path)
    parser.add_argument("--names", required=True, type=Path, help="JSON array of file stems in reading order")
    parser.add_argument("--columns", type=int, default=2)
    parser.add_argument("--rows", type=int, default=4)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    names = json.loads(args.names.read_text())
    if (not isinstance(names, list) or not names or min(args.columns, args.rows) < 1
            or len(names) != args.columns * args.rows
            or not all(isinstance(n, str) and re.fullmatch(r"[A-Za-z0-9_-]+", n) for n in names)
            or len(set(n.lower() for n in names)) != len(names)):
        parser.error("Supply one unique filename stem per cell in reading order.")
    if args.out.exists() and any((args.out / (n + ".png")).exists() for n in names):
        parser.error("The destination already contains an output mark.")
    with Image.open(args.sheet) as source:
        marks = list(extract(ImageOps.exif_transpose(source).convert("L"), names, args.columns, args.rows))
    args.out.mkdir(parents=True, exist_ok=True)
    for name, mark in marks:
        mark.save(args.out / (name + ".png"))
        print(name, mark.width, mark.height)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Numbered contact sheet for scoring: numbered_sheet.py OUT.jpg COLS img...  (big number + short label on each tile)"""
import sys, os
from PIL import Image, ImageDraw, ImageFont
out, cols, files = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
W = 900
F = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 64)
f = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 26)
tiles = []
for i, p in enumerate(files):
    im = Image.open(p).convert('RGB'); im.thumbnail((W, W))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 110, 84], fill=(0, 0, 0)); d.text((18, 8), str(i + int(os.environ.get("START", "1"))), fill='white', font=F)
    label = os.path.basename(p).split('.')[0]
    label = '-'.join(label.split('-')[1:]) if label[:2].isdigit() else label
    tw = d.textlength(label, font=f)
    d.rectangle([0, im.height - 40, tw + 20, im.height], fill=(0, 0, 0)); d.text((10, im.height - 36), label, fill='white', font=f)
    tiles.append(im)
th = max(t.height for t in tiles); rows = (len(tiles) + cols - 1) // cols
s = Image.new('RGB', (cols * W + (cols - 1) * 8, rows * th + (rows - 1) * 8), 'white')
for i, t in enumerate(tiles):
    s.paste(t, ((i % cols) * (W + 8), (i // cols) * (th + 8)))
s.save(out, quality=86)
print(out, s.size)

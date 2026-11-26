# Original identity sheet

Seedream 5.5 · Fil · master sheet

Draw eight original professional monochrome vector-like identity assets on a perfectly flat pure white sheet. Precision delivery sheet for extraction: exactly TWO equal columns and FOUR equal rows, covering the canvas in a regular invisible grid, each logo centered in its own cell with very generous white margins on all sides. No drawn grid, rules, panel borders, paper grain, mockups, title, explanatory words or subtitles. Use solid near-black ink only. All seven company names are invented. Each logo is wide and legible at 90 pixels wide. Words in quotes must be spelled exactly. Row 1 left: the primary lowercase wordmark 'folvra' in a custom, sturdy geometric grotesk, with a sharply carved f and lightly flared terminal on a. Row 1 right: standalone single compact folded-leaf F monogram for Folvra, symbol only. Row 2 left: 'Ternwick' with a compact angular tern bird symbol; row 2 right: 'Veysett' with a rhythmic doubled-chevron V, neat modernist letters. Row 3 left: 'Orriven' in an original oval-ligature serif wordmark; row 3 right: 'Sablequay' with a little architectural tide gate sign. Row 4 left: 'Kelmora' in architectural spaced caps with a woven square K; row 4 right: 'Brindlefold' with a folded paper B and sharply cut humanist letters. Balanced optical weight, distinct lettering and silhouettes like a boutique brand designer's portfolio. Each lockup has exactly one symbol or typographic idea and its own character. Keep all logos completely separated on white, every one on a single line.

## Extraction

Install Pillow in your Python environment. Run from the skill folder.

```sh
python3 scripts/extract_sheet.py sheet.png --names references/reading-order.json --out marks
```

The dark outlines and interior counters should survive at the final display size. Compare the extracted names against the sheet before publishing.

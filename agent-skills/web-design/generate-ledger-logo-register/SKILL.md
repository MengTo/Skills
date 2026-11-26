---
name: generate-ledger-logo-register
description: Generate a family of original fictional wordmarks on a Seedream contact sheet, extract transparent assets, and present them as a partner or studio logo register.
---

# Generate a Ledger Logo Register

Design the family on one extraction sheet. Give each brand its own type construction and silhouette, then carry the independent transparent marks into a ledger with meaningful metadata.

Extracted from the Folvra studio ledger. Open the [working example](demo/index.html) and its [recreation prompt](demo/PROMPT.md).

## Prepare the commission

Write a list of invented names, exact capitalization, discipline and one distinct visual idea per name. Check that each name stays legible around 90px wide. Folvra used the primary wordmark and symbol in the first row, then six partners in three more rows. Treat supplied real brands as supplied artwork.

## Generate for extraction

Use the exact [production prompt](references/generation-prompt.md) as a replaceable template. Request black ink on pure white, two equal columns by four equal rows, generous padding and a fixed reading order. Keep sheet labels, drawn gridlines, texture and presentation mockups out of the artwork. Folvra used Seedream 5.5 in Fil. Follow the selected provider’s normal generation and cost workflow.

## Inspect and cut

Read every name letter by letter against the manifest before cropping. Check the grid boundaries and the smallest counters. A misspelling warrants a targeted replacement of its cell. Use scripts/extract_sheet.py with the sheet and an ordered JSON list of output stems. It estimates the ink bounds per cell, preserves antialiasing as alpha, trims the white and exports independent lossless marks. Open them over both light and dark backgrounds to check the edges.

## Typeset the register

Use an ordered list. Give each row or folio an index, accessible brand name and its discipline. Size the logo by the shape of its ink, retaining its aspect ratio. Use the same optical band for most marks and let unusually thin or tall symbols breathe. Check the sequence on mobile and provide alt text for every identity. The Company Logos skill covers existing brands and icon libraries.

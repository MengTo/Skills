---
name: painted-product-showcase
description: Build interactive HTML product demos over expansive painted landscapes, with translucent neutral panels, sample data, and stateful charts, invoices or budgets.
---

# Painted Product Showcase

Frame a small working interface inside a much larger painting. The landscape gives scale and atmosphere while every product action in the panel updates a coherent local data model.

Extracted from the Folvra studio ledger. Open the [working example](demo/index.html) and its [recreation prompt](demo/PROMPT.md).

## Find the quiet part of the image

Place a full-width painting first. Inspect its horizon, brightest water and strongest building silhouette. Offset a compact panel into open sky or quiet water. Folvra left roughly three quarters of its harbor painting visible in a measured 1200px layout. Give the two smaller features separate landscapes and an asymmetric vertical offset.

## Build a neutral surface

Use translucent charcoal, a subtle neutral border and a restrained shadow. Keep land and water faintly visible through the surface. Separate a high-contrast serif value from a small mono status. Avoid tinting the whole panel to match a green or warm painting. At phone width give controls room to wrap and keep part of the painting around the panel.

## Give each scene real data

Implement live HTML buttons, tabs and status text. In the Folvra demo, available balance equals opening balance plus receipts less costs. Approve and pay a sample invoice once, then reflect the payment in the same quarter. Keep a new quarter’s data independent. A currency choice updates the amount as well as its label. A budget switch updates its whole set of values.

## Control playback

Run a slow demonstration only while the panel is visible. Give the viewer a pause control and let manual interaction take precedence. Respect reduced motion, preserve keyboard navigation and show immediate state feedback. Verify invoice payment, switching quarter and coming back, chart inspection and currency/budget changes. Art remains visible when animation stops.

## Source walkthrough

The offline demo includes its runtime and artwork. Read the corresponding production modules to adapt the behavior in another project. [ledger.js](references/ledger.js), [water.js](references/water.js).

---
name: segmented-field-menu
description: "Create an inset upper-right navigation dock with compact icon-and-label segments, a pale selected segment and a matching footer dock for an editorial landing page."
---

# Segmented Field Menu

Put a nav landmark on the same content inset as the wordmark. Use a softly raised, dark housing with 3–4px inner padding. Give segments a shared height, small radius and restrained gap. Use one icon family such as Solar Duotone. When selected, reverse the ink onto a pale ivory plate. Reserve hover for a smaller change.

Use ordinary fragment anchors for destinations. Use a real button for actions such as opening a reader. Determine the current section against a stable reading line, rather than from whichever observer callback ran last. Keep a single aria-current="location" inside each dock. Preserve the browser's hash and Back behavior, and ensure focus lands at a useful destination when the link is activated.

On narrow screens shorten the visible labels or show the icons alone. Give each icon-only control an accessible name, a reliable touch target and a visible focus ring. Mark decorative SVGs aria-hidden. Reuse the same housing and ink tokens for the footer, even when its labels differ.

Try the last link, return to the first, then use browser Back. Check the selected and hovered states together, long translations and keyboard order at 320px.

Open [the interactive study](demo/index.html) to inspect the technique.

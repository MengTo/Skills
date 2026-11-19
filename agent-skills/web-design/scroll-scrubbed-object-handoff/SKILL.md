---
name: scroll-scrubbed-object-handoff
description: Choreograph a reversible scroll handoff between layered illustrations, transforming a held object into multiple moving pieces that land in a second scene.
---

# Scroll-Scrubbed Object Handoff

Measure the giving hand, receiving hand and destination, then calculate every layer from a single normalized scroll position. A shared source and destination make seven separate coins read as the same transferred advance.

Extracted from the Folvra studio ledger. Open the [working example](demo/index.html) and its [recreation prompt](demo/PROMPT.md).

## Register the contact

Keep arms, carried object, foreground finger, token and destination figure as separate alpha cutouts. Extend forearms beyond the viewport. Mark the string attachment and palm support in local image coordinates. Measure those points after layout and fonts settle and whenever the container changes size. Preserve the original composition at both ends.

## Set the sequence

Pin the stage while the story is traversed. For the opening give, apply smoothstep from progress .008 to .285. Maintain contact before release begins around .325. Crossfade the opening between .45 and .69, then bring in the second painting between .54 and .84. Use these values as a reference for the approved pacing.

## Move the same object

Place the fan’s origin at the measured purse position. Give each token a repeatable index offset. In Folvra fan motion starts around .33 and finishes near .62; tokens start landing around .58, with the last near .93. Reduce diameter as each token enters the laptop. Alternate lean, depth and roll and keep a brief interval in which the full exchange reads clearly. Reuse the minted artwork for both the cylinder faces and flat fallback.

## Make seeking reversible

Calculate position, angle, opacity and scale directly from progress. Avoid spawning coins on scroll events. Hide and disable controls that belong to the outgoing scene, then restore their keyboard order on the return journey. Provide a static beginning, tokens and destination for reduced motion. Verify the beginning, grip, fan, arrival, a fast jump and the reverse path at desktop and phone widths.

## Source walkthrough

The offline demo includes its runtime and artwork. Read the corresponding production modules to adapt the behavior in another project. [handoff.js](references/handoff.js), [engraving.js](references/engraving.js), [paint-shader.js](references/paint-shader.js), [coin-light.js](references/coin-light.js).

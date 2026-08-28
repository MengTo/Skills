# Composition and Motion Direction

Read this before writing copy or animation. The goal is not to decorate a Three.js scene; it is to turn the exact scene into a designed moving composition.

## Reference audit sheet

Inspect the source at its intended aspect ratio and record:

| Layer | What to capture | Failure it prevents |
| --- | --- | --- |
| Native stage | Background, horizon, floor, camera crop, authored frame | Adding an unrelated container or changing the scene's visual identity |
| Subject silhouette | Bounds at start, midpoint, and maximum response | Type that clears the still frame but overlaps during motion |
| Shadow/effects | Long shadows, bloom, particles, glow radius | Treating empty-looking pixels as safe text space |
| Visual core | Brightest/highest-contrast region and primary control | Competing focal points |
| Negative space | Regions that remain clear across the full cycle | Solving overlap by shrinking the heading later |
| Semantic cues | Product behavior, material, world, existing copy | Generic slogans and repeated copy across variants |
| Motion cues | Insert, orbit, pulse, flow, switch, scan, tilt | Applying one motion preset to unrelated references |

Draw subject-safe zones from the largest observed silhouette, including its shadow and bloom. A zone is not safe because it is empty in one screenshot.

## Message rules

- Use one meaningful statement, normally `2–8` words across `1–3` rows.
- Make it say something about the scene: what it does, how it behaves, what it promises, or what world it belongs to.
- Preserve strong existing reference copy when it already carries the composition.
- Prefer specific verbs and nouns over abstract technology language.
- Avoid labels such as `SYSTEM 01`, `EXPERIENCE`, `NEXT GENERATION`, or `IMMERSIVE` unless the reference itself earns them.
- Do not repeat a grammatical template across a batch. Seven scenes should read like seven authored titles, not seven substitutions.

The heading is the message. Do not add a small sentence to explain it.

## Match physical behavior to type motion

Use this as a selection guide, not a set of presets:

| Reference behavior | Useful type grammar | Common failure |
| --- | --- | --- |
| Insertion, stacking, slots, cards | Lateral translation, short skew, firm settle | Generic vertical reveal ignores the object's mechanics |
| CRT, terminal, workstation | Vertical rise, restrained blur, scan-like timing | Glitch noise overwhelms the actual scene |
| Energy field, vortex, filament | Depth rotation, tracking change, orbital drift | Type crosses the bright core or imitates the shader literally |
| Diffraction, iridescence, optical material | Perspective turn, spectral shadows, slow optical tilt | Gradient clipping or excessive color makes text illegible |
| Arcade, collectible, game card | Stepped strike, short roll, pixel-like overshoot | Bounce turns the composition into a toy UI |
| Liquid, gel, tubes | Anisotropic stretch, soft settle, vertical flow | Uniform scale reads as ordinary zoom rather than material behavior |
| Industrial control, selector, machine | Staged slide, skew, mechanical cadence | Generic futuristic typography weakens the physical object |

Change at least four of these between variants: message, typeface category, placement, entrance direction, transformation family, pacing, color/shadow treatment, and camera path.

## Camera budget

Separate **static composition offset** from **animated camera movement**.

- Static offset may move the intact renderer to open a verified type field. It must not crop the subject or invent a separate frame.
- Start animated scale near `0.90–1.01`. Treat `1.03` as a proof boundary: exceed it only after checking the full subject and shadow at every key state.
- Keep animated x/y travel around `0.5–1%` of the viewport. A deliberate orbit can approach `2%` if the subject remains stable.
- Keep host rotations around `0.2–1.25deg`. The scene's own camera may move more if that motion is already authored.
- Use three or four landings across ten seconds. Pause long enough for each composition to read.
- Never stack a strong host orbit on top of an already strong internal orbit.

The subject should feel alive, not inspected through a zoom lens.

## Ten-second choreography

A useful first pass:

| Time | Scene | Message |
| --- | --- | --- |
| `0.0–0.6s` | Establish native subject and begin first restrained arc | Hidden or beginning a complete-row entrance |
| `0.6–1.8s` | Settle toward first landing | Enter in reference-specific direction; `0.08–0.16s` row stagger |
| `1.8–7.0s` | Two slow arcs with readable pauses | Fully readable hold with only subtle material motion |
| `7.0–8.6s` | Begin return path | Exit as complete rows; do not pass through a mask |
| `8.6–10.0s` | Rejoin loop seam without a camera jump | Hidden or in designed breathing room |

Adjust the beats when the reference has authored timing worth preserving. The hold should remain much longer than the entrance.

## No-overlap and no-clipping proof

Check at minimum:

1. The first visible message frame.
2. Maximum entrance displacement or rotation.
3. The final settled hold.
4. Maximum scene orbit/zoom.
5. The first exit frame.
6. Maximum exit displacement or rotation.

At each point inspect the full glyph, blur, glow, and shadow bounds. Parent rows must be overflow-visible. If the viewport itself clips a shadow, move or resize the composition; do not remove the shadow merely to pass the check.

## Responsive composition

- Recompose instead of proportionally shrinking everything.
- Preserve the subject first, then move message rows into the safest remaining bands.
- Keep one message and the same semantic line order.
- Reduce row stagger and motion distance on small screens.
- If the subject consumes the viewport, use a designed still or a calmer stacked composition; never overlay the heading on the subject because space is scarce.

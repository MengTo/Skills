---
name: test-playable-web-games
description: Test a playable browser game end to end with deterministic fixtures and real browser evidence. Use for gameplay QA, regression testing, controls, accessibility, responsive/mobile testing, save flows, console checks, performance smoke tests, and release verification.
---

# Test Playable Web Games

Combine deterministic tests with short real playthroughs. Do not treat a green build as gameplay proof.

## Start with a test matrix

Map the player journey: launch, new game, controls, core action, enemy encounter, reward, inventory/progression, save/continue, loss/retry, pause, settings, and completion. Add device variants for desktop keyboard/mouse, touch portrait, touch landscape, and reduced motion.

## Prefer deterministic review states

Create seedable fixtures, debug routes, or query parameters for combat phase, inventory loadout, boss phase, tutorial step, save migration, low health, and error states. Test important transitions directly rather than grinding through the campaign.

## Verify the player experience

Use the repository-approved browser surface and honor local browser restrictions. Confirm screen-visible feedback after each meaningful action: control response, target state, damage/resource state, UI update, and navigation. Inspect console warnings/errors and sample performance only on a representative live scene.

## Report actionable evidence

Record reproduction steps, expected versus actual result, severity, device/viewport, and the shortest useful proof. Separate new regressions from pre-existing baseline issues. After testing, close idle browser pages, dev servers, and benchmarks while leaving active task resources alone.

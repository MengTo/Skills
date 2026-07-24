---
name: design-game-encounters
description: Design, implement, tune, or test Three.js action-game encounters. Use for arena layout, enemy composition, spawn pacing, objectives, boss phases, reward cadence, encounter fixtures, and difficulty validation.
---

# Design Game Encounters

Design encounters as decisions, not actor counts.

## Compose

Define objective, available space, enemy roles, spawn timing, hazards, player resources, exits, failure recovery, and reward. Add one pressure source at a time; require each archetype to create a distinct response.

## Keep it fair

Protect readable paths, telegraphs, camera sight lines, and recovery windows. Cap simultaneous committed attackers and avoid offscreen damage, unavoidable chains, or encounter resets that duplicate rewards.

## Validate

Create deterministic starts for low resources, each wave, boss phase, victory, and death/retry. Test desktop and mobile at the real camera distance, then adjust composition from observed decisions rather than raw completion time.

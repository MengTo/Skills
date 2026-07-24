---
name: build-game-inventory
description: Build or repair game inventory, loot, equipment, tooltips, drag-and-drop, persistence, and progression systems. Use for item schemas, pickup flows, stack rules, equipment slots, atomic swaps, save migration, and no-loss regression testing.
---

# Build Game Inventory

Use one typed, serializable item source of truth and make every transfer atomic.

## Define the item contract

Model stable IDs, item definitions, ownership, stack limits, equipment compatibility, effects, rarity, presentation data, and migration version separately. Runtime UI must reference definitions by ID rather than duplicate stats or descriptions.

## Implement transfers as transactions

For pickup, equip, unequip, swap, drag/drop, consume, and sell:

1. Validate source ownership and destination legality.
2. Compute the entire next inventory/equipment state.
3. Commit once or reject without changing either side.
4. Persist only after the committed state is valid.

Never remove an item before confirming a legal destination. Preserve item identity across a swap and prevent duplicate effect registration.

## Build usable UI

Expose slot compatibility, equipped state, quantity, tooltip facts, and failure feedback. Support keyboard and touch alternatives to drag-only interactions. Keep focus behavior, dialogs, and tooltips accessible.

## Test loss boundaries

Cover invalid destinations, full inventory, duplicate pickup, equip swap, mid-action swap, save/load, schema migration, reset/new game, tooltip updates, and repeated dispatch. Validate that total owned item identity is conserved except for explicit consumption or reward rules.

#!/usr/bin/env python3
"""Validate a rigged character or monster asset manifest."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


CHARACTER_ACTION_ROLES = {
    "idle",
    "walk",
    "run",
    "primary-attack",
    "hit",
    "dodge",
    "death",
}
MONSTER_ACTION_ROLES = {
    "idle",
    "locomotion",
    "primary-attack",
    "hit",
    "death",
}
CHARACTER_SOCKET_ROLES = {
    "root",
    "hips",
    "head",
    "left-hand",
    "right-hand",
    "back",
    "left-foot",
    "right-foot",
}
MONSTER_SOCKET_ROLES = {"root", "center-mass", "head", "vfx-origin"}
CHARACTER_SLOTS = {
    "headgear",
    "vestment",
    "gloves",
    "leggings",
    "boots",
    "main-hand",
    "offhand",
    "back-ranged",
}
COMMON_CONTROLS = {"action-select", "restart", "play-pause", "drag-rotate"}
VERIFIED_COMMON = {
    "focusedTests",
    "build",
    "lint",
    "fullTestsRun",
    "fullTestsPassedOrBaselineDocumented",
    "browserDesktop",
    "browserNarrow",
    "consoleClean",
    "scroll",
    "dragRotation",
    "allActions",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate a build-rigged-game-assets JSON manifest.",
    )
    parser.add_argument("manifest", type=Path)
    parser.add_argument(
        "--root",
        type=Path,
        help="Repository root used to verify declared shipped files.",
    )
    parser.add_argument(
        "--require-verified",
        action="store_true",
        help="Require all implementation and browser verification gates.",
    )
    return parser.parse_args()


def is_nonempty_string(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def expect_string(
    container: dict[str, Any],
    key: str,
    path: str,
    errors: list[str],
) -> str | None:
    value = container.get(key)
    if not is_nonempty_string(value):
        errors.append(f"{path}.{key} must be a non-empty string")
        return None
    return value


def expect_list(
    container: dict[str, Any],
    key: str,
    path: str,
    errors: list[str],
) -> list[Any]:
    value = container.get(key)
    if not isinstance(value, list) or not value:
        errors.append(f"{path}.{key} must be a non-empty array")
        return []
    return value


def unique_values(
    entries: list[Any],
    key: str,
    path: str,
    errors: list[str],
) -> set[str]:
    values: list[str] = []
    for index, entry in enumerate(entries):
        if not isinstance(entry, dict):
            errors.append(f"{path}[{index}] must be an object")
            continue
        value = entry.get(key)
        if not is_nonempty_string(value):
            errors.append(f"{path}[{index}].{key} must be a non-empty string")
            continue
        values.append(value)
    duplicates = sorted({value for value in values if values.count(value) > 1})
    if duplicates:
        errors.append(f"{path} contains duplicate {key} values: {duplicates}")
    return set(values)


def resolve_declared_file(root: Path, declared: str) -> Path:
    path = Path(declared)
    if path.is_absolute():
        public_candidate = root / "public" / declared.lstrip("/")
        return public_candidate if public_candidate.exists() else path
    return root / path


def validate_files(
    manifest: dict[str, Any],
    root: Path | None,
    errors: list[str],
) -> None:
    files = manifest.get("files")
    if not isinstance(files, dict):
        errors.append("files must be an object")
        return
    required = ["sourceModel", "mainModel", "catalogPng"]
    if manifest.get("status") == "runtime":
        required.append("runtimeModel")
    declared: list[tuple[str, str]] = []
    for key in required:
        value = expect_string(files, key, "files", errors)
        if value:
            declared.append((f"files.{key}", value))

    catalog = manifest.get("catalog")
    if isinstance(catalog, dict):
        card_image = expect_string(catalog, "cardImage", "catalog", errors)
        if card_image:
            declared.append(("catalog.cardImage", card_image))

    actions = manifest.get("actions")
    if isinstance(actions, list):
        for index, action in enumerate(actions):
            if not isinstance(action, dict):
                continue
            action_file = expect_string(
                action,
                "file",
                f"actions[{index}]",
                errors,
            )
            if action_file:
                declared.append((f"actions[{index}].file", action_file))

    equipment = manifest.get("equipment")
    if isinstance(equipment, dict):
        slots = equipment.get("slots")
        if isinstance(slots, list):
            for index, slot in enumerate(slots):
                if not isinstance(slot, dict) or slot.get("supported") is not True:
                    continue
                asset = expect_string(
                    slot,
                    "asset",
                    f"equipment.slots[{index}]",
                    errors,
                )
                if asset:
                    declared.append((f"equipment.slots[{index}].asset", asset))

    if root:
        for field, declared_path in declared:
            if not resolve_declared_file(root, declared_path).is_file():
                errors.append(f"{field} does not resolve to a shipped file: {declared_path}")


def validate_rig(
    manifest: dict[str, Any],
    kind: str,
    errors: list[str],
) -> None:
    rig = manifest.get("rig")
    if not isinstance(rig, dict):
        errors.append("rig must be an object")
        return
    expect_string(rig, "skeletonId", "rig", errors)
    expect_string(rig, "rootBone", "rig", errors)
    if rig.get("maxSkinInfluences") != 4:
        errors.append("rig.maxSkinInfluences must be 4")
    height = rig.get("actorHeightMeters")
    if not isinstance(height, (int, float)) or height <= 0:
        errors.append("rig.actorHeightMeters must be a positive number")
    sockets = expect_list(rig, "sockets", "rig", errors)
    roles = unique_values(sockets, "role", "rig.sockets", errors)
    required = (
        CHARACTER_SOCKET_ROLES
        if kind == "character"
        else MONSTER_SOCKET_ROLES
    )
    missing = sorted(required - roles)
    if missing:
        errors.append(f"rig.sockets is missing required roles: {missing}")
    for index, socket in enumerate(sockets):
        if isinstance(socket, dict):
            expect_string(socket, "name", f"rig.sockets[{index}]", errors)


def validate_actions(
    manifest: dict[str, Any],
    kind: str,
    errors: list[str],
) -> set[str]:
    actions = expect_list(manifest, "actions", "manifest", errors)
    unique_values(actions, "id", "actions", errors)
    roles = unique_values(actions, "role", "actions", errors)
    required = (
        CHARACTER_ACTION_ROLES
        if kind == "character"
        else MONSTER_ACTION_ROLES
    )
    missing = sorted(required - roles)
    if missing:
        errors.append(f"actions is missing required roles: {missing}")
    valid_root_motion = {"in-place", "authored", "extracted"}
    for index, action in enumerate(actions):
        if not isinstance(action, dict):
            continue
        if not isinstance(action.get("loop"), bool):
            errors.append(f"actions[{index}].loop must be a boolean")
        if action.get("rootMotion") not in valid_root_motion:
            errors.append(
                f"actions[{index}].rootMotion must be one of {sorted(valid_root_motion)}",
            )
        duration = action.get("durationSeconds")
        if not isinstance(duration, (int, float)) or duration <= 0:
            errors.append(f"actions[{index}].durationSeconds must be positive")
        if not isinstance(action.get("contactEvents"), list):
            errors.append(f"actions[{index}].contactEvents must be an array")
    return {
        action.get("id")
        for action in actions
        if isinstance(action, dict) and is_nonempty_string(action.get("id"))
    }


def validate_character(manifest: dict[str, Any], errors: list[str]) -> None:
    equipment = manifest.get("equipment")
    if not isinstance(equipment, dict):
        errors.append("character equipment must be an object")
        return
    if equipment.get("separateFromMainModel") is not True:
        errors.append("character equipment.separateFromMainModel must be true")
    slots = expect_list(equipment, "slots", "equipment", errors)
    slot_ids = unique_values(slots, "id", "equipment.slots", errors)
    missing = sorted(CHARACTER_SLOTS - slot_ids)
    if missing:
        errors.append(f"equipment.slots is missing canonical declarations: {missing}")
    for index, slot in enumerate(slots):
        if not isinstance(slot, dict):
            continue
        if not isinstance(slot.get("supported"), bool):
            errors.append(f"equipment.slots[{index}].supported must be a boolean")
        if slot.get("supported") is True:
            expect_string(slot, "asset", f"equipment.slots[{index}]", errors)
            expect_string(slot, "socket", f"equipment.slots[{index}]", errors)
    collision = manifest.get("collision")
    if not isinstance(collision, dict):
        errors.append("character collision must be an object")
    elif not isinstance(collision.get("navigation"), dict):
        errors.append("character collision.navigation must be an object")
    elif not isinstance(collision.get("hurtboxes"), list) or not collision["hurtboxes"]:
        errors.append("character collision.hurtboxes must be a non-empty array")


def validate_monster(
    manifest: dict[str, Any],
    action_ids: set[str],
    errors: list[str],
) -> None:
    equipment = manifest.get("equipment")
    if isinstance(equipment, dict) and equipment.get("separateFromMainModel") is not True:
        errors.append("monster equipment must be separate when declared")
    combat = manifest.get("combat")
    if not isinstance(combat, dict):
        errors.append("monster combat must be an object")
        return
    if not isinstance(combat.get("navigationCollider"), dict):
        errors.append("monster combat.navigationCollider must be an object")
    hurtboxes = combat.get("hurtboxes")
    if not isinstance(hurtboxes, list) or not hurtboxes:
        errors.append("monster combat.hurtboxes must be a non-empty array")
    attacks = combat.get("attacks")
    if not isinstance(attacks, list) or not attacks:
        errors.append("monster combat.attacks must be a non-empty array")
        return
    unique_values(attacks, "id", "combat.attacks", errors)
    for index, attack in enumerate(attacks):
        if not isinstance(attack, dict):
            continue
        action_id = expect_string(
            attack,
            "actionId",
            f"combat.attacks[{index}]",
            errors,
        )
        if action_id and action_id not in action_ids:
            errors.append(
                f"combat.attacks[{index}].actionId is not declared in actions: {action_id}",
            )
        expect_string(
            attack,
            "originSocket",
            f"combat.attacks[{index}]",
            errors,
        )
        for field in ("telegraphSeconds", "activeSeconds", "recoverySeconds"):
            value = attack.get(field)
            if not isinstance(value, (int, float)) or value < 0:
                errors.append(
                    f"combat.attacks[{index}].{field} must be a non-negative number",
                )


def validate_catalog(
    manifest: dict[str, Any],
    kind: str,
    errors: list[str],
) -> None:
    catalog = manifest.get("catalog")
    if not isinstance(catalog, dict):
        errors.append("catalog must be an object")
        return
    expect_string(catalog, "inspectorRoute", "catalog", errors)
    if catalog.get("cardCanvasCount") != 0:
        errors.append("catalog.cardCanvasCount must be 0")
    if catalog.get("inspectorCanvasCount") != 1:
        errors.append("catalog.inspectorCanvasCount must be 1")
    controls = catalog.get("controls")
    if not isinstance(controls, list):
        errors.append("catalog.controls must be an array")
        return
    control_set = {control for control in controls if isinstance(control, str)}
    required = set(COMMON_CONTROLS)
    required.add("equipment-toggle" if kind == "character" else "combat-state")
    missing = sorted(required - control_set)
    if missing:
        errors.append(f"catalog.controls is missing required controls: {missing}")


def validate_verification(
    manifest: dict[str, Any],
    kind: str,
    require_verified: bool,
    errors: list[str],
) -> None:
    verification = manifest.get("verification")
    if not isinstance(verification, dict):
        errors.append("verification must be an object")
        return
    required = set(VERIFIED_COMMON)
    required.add(
        "equipmentOffArtifactFree"
        if kind == "character"
        else "monsterCombatContract",
    )
    missing = sorted(required - set(verification))
    if missing:
        errors.append(f"verification is missing gates: {missing}")
    for key in sorted(required & set(verification)):
        if not isinstance(verification[key], bool):
            errors.append(f"verification.{key} must be a boolean")
        elif require_verified and verification[key] is not True:
            errors.append(f"verification.{key} must be true for release")


def validate_manifest(
    manifest: dict[str, Any],
    root: Path | None,
    require_verified: bool,
) -> list[str]:
    errors: list[str] = []
    if manifest.get("schemaVersion") != 1:
        errors.append("schemaVersion must be 1")
    expect_string(manifest, "id", "manifest", errors)
    kind = manifest.get("kind")
    if kind not in {"character", "monster"}:
        errors.append("kind must be character or monster")
        kind = "character"
    if manifest.get("status") not in {"catalog-only", "review-only", "runtime"}:
        errors.append("status must be catalog-only, review-only, or runtime")
    provenance = manifest.get("provenance")
    if not isinstance(provenance, dict):
        errors.append("provenance must be an object")
    else:
        expect_string(provenance, "pipeline", "provenance", errors)
        expect_string(provenance, "source", "provenance", errors)
    budget = manifest.get("budget")
    if not isinstance(budget, dict):
        errors.append("budget must be an object")
    else:
        for field in (
            "runtimeTriangles",
            "runtimeBytes",
            "materials",
            "textures",
            "skinnedMeshes",
            "bones",
        ):
            value = budget.get(field)
            if not isinstance(value, int) or value < 0:
                errors.append(f"budget.{field} must be a non-negative integer")

    validate_files(manifest, root, errors)
    validate_rig(manifest, kind, errors)
    action_ids = validate_actions(manifest, kind, errors)
    if kind == "character":
        validate_character(manifest, errors)
    else:
        validate_monster(manifest, action_ids, errors)
    validate_catalog(manifest, kind, errors)
    validate_verification(manifest, kind, require_verified, errors)
    return errors


def main() -> int:
    args = parse_args()
    try:
        manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        print(f"[FAIL] Could not read manifest: {error}")
        return 1
    if not isinstance(manifest, dict):
        print("[FAIL] Manifest root must be an object")
        return 1
    root = args.root.resolve() if args.root else None
    errors = validate_manifest(manifest, root, args.require_verified)
    if errors:
        print(f"[FAIL] {args.manifest}: {len(errors)} error(s)")
        for error in errors:
            print(f"  - {error}")
        return 1
    print(
        f"[OK] {args.manifest}: {manifest['kind']} {manifest['id']} "
        f"({manifest['status']})",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

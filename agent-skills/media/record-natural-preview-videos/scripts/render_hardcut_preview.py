#!/usr/bin/env python3
"""Render a dense browser-preview config without crossfading adjacent frames."""

from __future__ import annotations

import argparse
import importlib.util
import json
from pathlib import Path
from types import ModuleType


def load_renderer(path: Path) -> ModuleType:
    spec = importlib.util.spec_from_file_location("browser_video_renderer", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load renderer: {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def hard_scene_at(time_s, scenes, shots, source_size):
    del source_size
    for start, name, _transition in reversed(scenes):
        if time_s >= start:
            return shots[name]
    return shots[scenes[0][1]]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--renderer", type=Path)
    args = parser.parse_args()

    skill_root = Path(__file__).resolve().parents[3]
    default_renderer = (
        skill_root
        / "codex"
        / "browser-video-recording"
        / "scripts"
        / "render_browser_demo.py"
    )
    renderer_path = args.renderer or default_renderer
    if not renderer_path.is_file():
        raise FileNotFoundError(f"Base browser renderer not found: {renderer_path}")

    config = json.loads(args.config.read_text())
    renderer = load_renderer(renderer_path)
    renderer.scene_at = hard_scene_at
    args.output.parent.mkdir(parents=True, exist_ok=True)
    renderer.render(config, args.output)
    print(args.output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

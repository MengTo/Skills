#!/usr/bin/env python3

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("inspect_video_exports.py")
SPEC = importlib.util.spec_from_file_location("inspect_video_exports", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class InspectVideoExportsTests(unittest.TestCase):
    def test_media_facts_do_not_assume_a_platform(self) -> None:
        self.assertEqual(MODULE.orientation(1920, 1080), "landscape")
        self.assertEqual(MODULE.orientation(1080, 1920), "portrait")
        self.assertEqual(MODULE.orientation(1080, 1080), "square")

    def test_supplied_profile_controls_eligibility(self) -> None:
        record = {
            "orientation": "portrait",
            "aspectRatio": 9 / 16,
            "displayAspectRatio": "9:16",
            "width": 1080,
            "height": 1920,
            "durationSeconds": 75.0,
            "hasAudio": True,
        }
        profile = {
            "name": "Current vertical profile",
            "allowedOrientations": ["portrait"],
            "allowedAspectRatios": ["9:16"],
            "maxDurationSeconds": 60,
            "requireAudio": True,
        }
        result = MODULE.evaluate_profile(record, profile)
        self.assertFalse(result["matches"])
        self.assertIn("durationSeconds 75 must be at most 60", result["issues"])


if __name__ == "__main__":
    unittest.main()

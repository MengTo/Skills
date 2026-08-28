#!/usr/bin/env python3

from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("check_caption_vocabulary.py")
SPEC = importlib.util.spec_from_file_location("check_caption_vocabulary", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class CaptionVocabularyTests(unittest.TestCase):
    def write_glossary(self, root: Path) -> Path:
        path = root / "glossary.json"
        path.write_text(
            json.dumps(
                {
                    "terms": [
                        {
                            "canonical": "Example Product Pro",
                            "aliases": ["Example Pro"],
                            "caseSensitive": False,
                        },
                        {
                            "canonical": "Example Product",
                            "aliases": ["ExampleProduct"],
                            "caseSensitive": False,
                        },
                    ]
                }
            ),
            encoding="utf-8",
        )
        return path

    def test_longest_alias_and_punctuation_are_preserved(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_dir:
            aliases = MODULE.load_glossary(self.write_glossary(Path(temporary_dir)))
            corrected, changes = MODULE.correct(
                "Try example pro, then ExampleProduct.", aliases
            )
            self.assertEqual(
                corrected, "Try Example Product Pro, then Example Product."
            )
            self.assertEqual(len(changes), 2)

    def test_conflicting_aliases_are_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_dir:
            root = Path(temporary_dir)
            glossary = root / "glossary.json"
            glossary.write_text(
                json.dumps(
                    {
                        "terms": [
                            {"canonical": "First", "aliases": ["Shared"]},
                            {"canonical": "Second", "aliases": ["shared"]},
                        ]
                    }
                ),
                encoding="utf-8",
            )
            with self.assertRaisesRegex(ValueError, "maps to both"):
                MODULE.load_glossary(glossary)

    def test_dry_run_does_not_write_and_apply_requires_output(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_dir:
            root = Path(temporary_dir)
            glossary = self.write_glossary(root)
            source = root / "captions.vtt"
            source.write_text("WEBVTT\n\nExampleProduct appears.\n", encoding="utf-8")
            output = root / "corrected.vtt"
            dry_run = subprocess.run(
                [
                    "python3",
                    str(SCRIPT),
                    "--glossary",
                    str(glossary),
                    "--input",
                    str(source),
                    "--format",
                    "json",
                ],
                check=False,
                capture_output=True,
                text=True,
            )
            self.assertEqual(dry_run.returncode, 0, dry_run.stderr)
            self.assertFalse(output.exists())
            applied = subprocess.run(
                [
                    "python3",
                    str(SCRIPT),
                    "--glossary",
                    str(glossary),
                    "--input",
                    str(source),
                    "--apply",
                    "--output",
                    str(output),
                ],
                check=False,
                capture_output=True,
                text=True,
            )
            self.assertEqual(applied.returncode, 0, applied.stderr)
            self.assertIn("Example Product appears.", output.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()

#!/usr/bin/env python3

from __future__ import annotations

import subprocess
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("validate_handbook_article.py")


class HandbookValidatorTests(unittest.TestCase):
    def run_validator(self, article: Path, *arguments: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            ["python3", str(SCRIPT), str(article), *arguments],
            check=False,
            capture_output=True,
            text=True,
        )

    def test_default_does_not_impose_destination_structure(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_dir:
            article = Path(temporary_dir) / "content.md"
            article.write_text(
                "# A concise guide\n\n## One useful step\n\nDo the verified thing.\n",
                encoding="utf-8",
            )
            result = self.run_validator(article)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_destination_policies_are_opt_in(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_dir:
            article = Path(temporary_dir) / "content.md"
            article.write_text(
                "# A concise guide\n\n## One useful step\n\nShort copy.\n", encoding="utf-8"
            )
            result = self.run_validator(
                article,
                "--min-sections",
                "2",
                "--min-words",
                "20",
                "--require-cover",
                "--require-resources",
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("minimum is 2", result.stdout)
            self.assertIn("final H2 section", result.stdout)


if __name__ == "__main__":
    unittest.main()

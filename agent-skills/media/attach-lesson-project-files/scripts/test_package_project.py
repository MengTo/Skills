#!/usr/bin/env python3

from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
import zipfile
from pathlib import Path


SCRIPT = Path(__file__).with_name("package_project.py")


class PackageProjectTests(unittest.TestCase):
    def run_packager(
        self, *arguments: str, expect_success: bool = True
    ) -> subprocess.CompletedProcess[str]:
        result = subprocess.run(
            ["python3", str(SCRIPT), *arguments],
            check=False,
            capture_output=True,
            text=True,
        )
        if expect_success and result.returncode != 0:
            self.fail(result.stderr)
        return result

    def test_directory_package_is_deterministic_and_excludes_generated_files(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_dir:
            root = Path(temporary_dir)
            source = root / "react-project"
            (source / "src").mkdir(parents=True)
            (source / "node_modules" / "package").mkdir(parents=True)
            (source / "src" / "App.jsx").write_text(
                "export default function App() { return <main>Hello</main>; }\n"
            )
            (source / "package.json").write_text('{"scripts":{"build":"vite build"}}\n')
            (source / "node_modules" / "package" / "index.js").write_text("generated\n")
            (source / ".env").write_text("SECRET=do-not-package\n")
            first = root / "first.zip"
            second = root / "second.zip"

            first_result = self.run_packager(
                "--source",
                str(source),
                "--root-name",
                "react-project",
                "--output",
                str(first),
            )
            second_result = self.run_packager(
                "--source",
                str(source),
                "--root-name",
                "react-project",
                "--output",
                str(second),
            )
            first_receipt = json.loads(first_result.stdout)
            second_receipt = json.loads(second_result.stdout)

            self.assertEqual(first.read_bytes(), second.read_bytes())
            self.assertEqual(first_receipt["sha256"], second_receipt["sha256"])
            self.assertEqual(
                first_receipt["files"],
                ["react-project/package.json", "react-project/src/App.jsx"],
            )
            self.assertEqual(
                {item["path"] for item in first_receipt["excluded"]},
                {".env", "node_modules"},
            )

    def test_explicit_files_preserve_a_clean_root_folder(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_dir:
            root = Path(temporary_dir)
            html = root / "index.html"
            prompt = root / "prompt.md"
            output = root / "project.zip"
            html.write_text("<!doctype html><title>Project</title>\n")
            prompt.write_text("# Prompt\n")

            self.run_packager(
                "--file",
                str(html),
                "--file",
                str(prompt),
                "--root-name",
                "lesson-project",
                "--output",
                str(output),
            )
            with zipfile.ZipFile(output) as archive:
                self.assertEqual(
                    archive.namelist(),
                    ["lesson-project/index.html", "lesson-project/prompt.md"],
                )

    def test_suspected_secret_stops_packaging(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_dir:
            root = Path(temporary_dir)
            source = root / "project"
            source.mkdir()
            (source / "config.js").write_text(
                'export const token = "ghp_abcdefghijklmnopqrstuvwxyz123456";\n'
            )
            result = self.run_packager(
                "--source",
                str(source),
                "--root-name",
                "project",
                "--output",
                str(root / "project.zip"),
                expect_success=False,
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("suspected GitHub token", result.stderr)


if __name__ == "__main__":
    unittest.main()

#!/usr/bin/env python3

from __future__ import annotations

import importlib.util
import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("validate_course_lesson.py")
EXTRACTOR = Path(__file__).with_name("extract_lesson_sources.py")
SPEC = importlib.util.spec_from_file_location("validate_course_lesson", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class VideoCourseLessonTests(unittest.TestCase):
    def make_package(self, root: Path, source_method: str = "final-video") -> Path:
        package = root / "lesson-one"
        (package / "images").mkdir(parents=True)
        (package / "content.md").write_text(
            "# Lesson one\n\n![A verified state](images/state.jpg)\n", encoding="utf-8"
        )
        (package / "transcript.txt").write_text("Verified transcript.\n", encoding="utf-8")
        (package / "images" / "state.jpg").write_bytes(b"test image")
        manifest: dict[str, object] = {
            "course": {"title": "Course", "slug": "course"},
            "lesson": {"number": 1, "title": "Lesson one", "slug": "lesson-one"},
            "sourceMethod": source_method,
            "images": ["images/state.jpg"],
        }
        if source_method == "final-video":
            manifest.update(
                {
                    "sourceVideo": {
                        "path": "/verified/final.mp4",
                        "sha256": "a" * 64,
                        "bytes": 100,
                        "durationSeconds": 10.0,
                        "width": 1920,
                        "height": 1080,
                        "frameRate": "30/1",
                        "hasAudio": True,
                    },
                    "transcriptSource": "/verified/transcript.txt",
                    "captures": [
                        {
                            "image": "images/state.jpg",
                            "brief": "A verified state",
                            "videoSeconds": 4.0,
                            "sourceTimestamp": "00:00:04.000",
                            "captureMethod": "direct-final-master-frame",
                        }
                    ],
                }
            )
        else:
            manifest.update(
                {
                    "editorAdapter": {"name": "Example adapter", "version": "1.0"},
                    "editorProject": "project-stable-id",
                    "captures": [
                        {
                            "image": "images/state.jpg",
                            "brief": "A verified state",
                            "requestedTimelineSeconds": 4.0,
                            "mappedSourceSeconds": 7.25,
                            "captureMethod": "source-frame-through-adapter",
                            "includedEffects": [],
                            "excludedEffects": ["captions"],
                        }
                    ],
                }
            )
        (package / "manifest.json").write_text(
            json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
        )
        return package

    def test_valid_final_video_package(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_dir:
            errors, warnings = MODULE.validate_package(
                self.make_package(Path(temporary_dir), "final-video")
            )
            self.assertEqual(errors, [])
            self.assertEqual(warnings, [])

    def test_valid_editor_adapter_package(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_dir:
            errors, warnings = MODULE.validate_package(
                self.make_package(Path(temporary_dir), "editor-project")
            )
            self.assertEqual(errors, [])
            self.assertEqual(warnings, [])

    def test_manifest_cannot_hide_article_text(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_dir:
            package = self.make_package(Path(temporary_dir), "final-video")
            manifest_path = package / "manifest.json"
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            manifest["content"] = "Article copy does not belong here."
            manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
            errors, _ = MODULE.validate_package(package)
            self.assertTrue(any("article text fields" in error for error in errors))

    @unittest.skipUnless(shutil.which("ffmpeg") and shutil.which("ffprobe"), "FFmpeg required")
    def test_final_video_extractor_builds_a_valid_package(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_dir:
            root = Path(temporary_dir)
            video = root / "final.mp4"
            transcript = root / "transcript.txt"
            transcript.write_text("A verified narration transcript.\n", encoding="utf-8")
            subprocess.run(
                [
                    "ffmpeg",
                    "-loglevel",
                    "error",
                    "-f",
                    "lavfi",
                    "-i",
                    "color=c=blue:s=640x360:d=2",
                    "-f",
                    "lavfi",
                    "-i",
                    "sine=frequency=440:duration=2",
                    "-shortest",
                    "-c:v",
                    "libx264",
                    "-pix_fmt",
                    "yuv420p",
                    "-c:a",
                    "aac",
                    str(video),
                ],
                check=True,
            )
            config = root / "sources.json"
            config.write_text(
                json.dumps(
                    {
                        "course": {"title": "Course", "slug": "course"},
                        "outputRoot": "./packages/course",
                        "lessons": [
                            {
                                "number": 1,
                                "title": "Lesson one",
                                "slug": "lesson-one",
                                "video": "./final.mp4",
                                "transcript": "./transcript.txt",
                                "captures": [
                                    {
                                        "videoSeconds": 1,
                                        "name": "verified-state",
                                        "brief": "A verified state",
                                    }
                                ],
                            }
                        ],
                    }
                ),
                encoding="utf-8",
            )
            result = subprocess.run(
                ["python3", str(EXTRACTOR), "--config", str(config)],
                check=False,
                capture_output=True,
                text=True,
            )
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            package = root / "packages" / "course" / "lesson-one"
            errors, warnings = MODULE.validate_package(package)
            self.assertEqual(errors, [])
            self.assertEqual(warnings, [])
            manifest = json.loads((package / "manifest.json").read_text(encoding="utf-8"))
            self.assertTrue(manifest["sourceVideo"]["hasAudio"])
            self.assertEqual(manifest["captures"][0]["captureMethod"], "direct-final-master-frame")


if __name__ == "__main__":
    unittest.main()

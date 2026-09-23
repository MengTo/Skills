#!/usr/bin/env python3
"""Build deterministic lesson evidence packages from verified final videos."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path


SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


@dataclass(frozen=True)
class PreparedLesson:
    lesson: dict[str, object]
    video: Path
    transcript: Path
    output_dir: Path
    video_sha256: str
    video_bytes: int
    media: dict[str, object]


def run(command: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, check=True, capture_output=True, text=True)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def resolve_path(raw: object, config_dir: Path, label: str) -> Path:
    if not isinstance(raw, str) or not raw.strip():
        raise ValueError(f"{label} must be a non-empty path string")
    path = Path(raw).expanduser()
    if not path.is_absolute():
        path = config_dir / path
    return path.resolve()


def require_slug(value: object, label: str) -> str:
    if not isinstance(value, str) or not SLUG_RE.fullmatch(value):
        raise ValueError(f"{label} must be a lowercase hyphen slug")
    return value


def probe_video(path: Path) -> dict[str, object]:
    result = run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "stream=codec_type,width,height,avg_frame_rate:format=duration",
            "-of",
            "json",
            str(path),
        ]
    )
    payload = json.loads(result.stdout)
    streams = payload.get("streams", [])
    video_stream = next(
        (stream for stream in streams if stream.get("codec_type") == "video"), None
    )
    if video_stream is None:
        raise ValueError(f"No video stream found in {path}")
    duration = float(payload.get("format", {}).get("duration", 0))
    if duration <= 0:
        raise ValueError(f"Could not determine a positive duration for {path}")
    return {
        "durationSeconds": round(duration, 3),
        "width": int(video_stream["width"]),
        "height": int(video_stream["height"]),
        "frameRate": video_stream.get("avg_frame_rate", "unknown"),
        "hasAudio": any(stream.get("codec_type") == "audio" for stream in streams),
    }


def timestamp_label(seconds: float) -> str:
    milliseconds = int(round(seconds * 1000))
    hours, remainder = divmod(milliseconds, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    whole_seconds, milliseconds = divmod(remainder, 1000)
    return f"{hours:02d}:{minutes:02d}:{whole_seconds:02d}.{milliseconds:03d}"


def prepare(config_path: Path, force: bool) -> tuple[dict[str, str], list[PreparedLesson]]:
    config = json.loads(config_path.read_text(encoding="utf-8"))
    config_dir = config_path.parent.resolve()
    course_raw = config.get("course")
    if not isinstance(course_raw, dict):
        raise ValueError("course must be an object")
    course_title = course_raw.get("title")
    if not isinstance(course_title, str) or not course_title.strip():
        raise ValueError("course.title must be a non-empty string")
    course = {
        "title": course_title.strip(),
        "slug": require_slug(course_raw.get("slug"), "course.slug"),
    }
    output_root = resolve_path(config.get("outputRoot"), config_dir, "outputRoot")
    lessons = config.get("lessons")
    if not isinstance(lessons, list) or not lessons:
        raise ValueError("lessons must be a non-empty array")

    prepared: list[PreparedLesson] = []
    seen_slugs: set[str] = set()
    for index, lesson_raw in enumerate(lessons, start=1):
        if not isinstance(lesson_raw, dict):
            raise ValueError(f"lessons[{index - 1}] must be an object")
        slug = require_slug(lesson_raw.get("slug"), f"lessons[{index - 1}].slug")
        if slug in seen_slugs:
            raise ValueError(f"Duplicate lesson slug: {slug}")
        seen_slugs.add(slug)
        title = lesson_raw.get("title")
        number = lesson_raw.get("number")
        if not isinstance(title, str) or not title.strip():
            raise ValueError(f"Lesson {slug} needs a non-empty title")
        if not isinstance(number, int) or isinstance(number, bool) or number < 1:
            raise ValueError(f"Lesson {slug} number must be a positive integer")

        video = resolve_path(lesson_raw.get("video"), config_dir, f"{slug}.video")
        transcript = resolve_path(
            lesson_raw.get("transcript"), config_dir, f"{slug}.transcript"
        )
        if not video.is_file():
            raise ValueError(f"Video does not exist: {video}")
        if not transcript.is_file():
            raise ValueError(f"Transcript does not exist: {transcript}")
        if not transcript.read_text(encoding="utf-8").strip():
            raise ValueError(f"Transcript is empty: {transcript}")

        video_digest = sha256(video)
        expected = lesson_raw.get("expectedVideoSha256")
        if expected is not None:
            if not isinstance(expected, str) or not re.fullmatch(r"[0-9a-fA-F]{64}", expected):
                raise ValueError(f"Lesson {slug} expectedVideoSha256 is invalid")
            if video_digest != expected.lower():
                raise ValueError(f"Lesson {slug} video checksum does not match")

        media = probe_video(video)
        captures = lesson_raw.get("captures")
        if not isinstance(captures, list) or not captures:
            raise ValueError(f"Lesson {slug} needs at least one capture")
        capture_names: list[str] = []
        for capture_index, capture in enumerate(captures):
            if not isinstance(capture, dict):
                raise ValueError(f"Lesson {slug} capture {capture_index} must be an object")
            name = require_slug(capture.get("name"), f"Lesson {slug} capture name")
            if name in capture_names:
                raise ValueError(f"Lesson {slug} repeats capture name {name}")
            capture_names.append(name)
            seconds = capture.get("videoSeconds")
            if not isinstance(seconds, (int, float)) or isinstance(seconds, bool):
                raise ValueError(f"Lesson {slug} capture {name} needs numeric videoSeconds")
            if float(seconds) < 0 or float(seconds) >= float(media["durationSeconds"]):
                raise ValueError(f"Lesson {slug} capture {name} is outside the video")
            brief = capture.get("brief")
            if not isinstance(brief, str) or not brief.strip():
                raise ValueError(f"Lesson {slug} capture {name} needs a brief")

        output_dir = output_root / slug
        generated = [output_dir / "manifest.json", output_dir / "transcript.txt"]
        generated.extend(output_dir / "images" / f"{name}.jpg" for name in capture_names)
        conflicts = [path for path in generated if path.exists()]
        if conflicts and not force:
            raise ValueError(
                f"Lesson {slug} already has generated output; use --force: {conflicts[0]}"
            )

        prepared.append(
            PreparedLesson(
                lesson={**lesson_raw, "title": title.strip(), "slug": slug, "number": number},
                video=video,
                transcript=transcript,
                output_dir=output_dir,
                video_sha256=video_digest,
                video_bytes=video.stat().st_size,
                media=media,
            )
        )
    return course, prepared


def extract_frame(video: Path, seconds: float, output: Path) -> None:
    run(
        [
            "ffmpeg",
            "-loglevel",
            "error",
            "-y",
            "-ss",
            f"{seconds:.3f}",
            "-i",
            str(video),
            "-frames:v",
            "1",
            "-vf",
            "scale=1600:900:force_original_aspect_ratio=decrease,"
            "pad=1600:900:(ow-iw)/2:(oh-ih)/2",
            "-q:v",
            "2",
            str(output),
        ]
    )


def write_package(course: dict[str, str], prepared: PreparedLesson) -> Path:
    lesson = prepared.lesson
    prepared.output_dir.mkdir(parents=True, exist_ok=True)
    images_dir = prepared.output_dir / "images"
    images_dir.mkdir(exist_ok=True)
    capture_records: list[dict[str, object]] = []
    image_paths: list[str] = []
    captures = lesson["captures"]
    assert isinstance(captures, list)
    for capture in captures:
        assert isinstance(capture, dict)
        seconds = float(capture["videoSeconds"])
        relative = f"images/{capture['name']}.jpg"
        output = prepared.output_dir / relative
        extract_frame(prepared.video, seconds, output)
        image_paths.append(relative)
        capture_records.append(
            {
                "image": relative,
                "brief": capture["brief"],
                "videoSeconds": round(seconds, 3),
                "sourceTimestamp": timestamp_label(seconds),
                "captureMethod": "direct-final-master-frame",
            }
        )

    transcript_output = prepared.output_dir / "transcript.txt"
    transcript_output.write_text(
        prepared.transcript.read_text(encoding="utf-8").rstrip() + "\n", encoding="utf-8"
    )
    manifest = {
        "course": course,
        "lesson": {
            "number": lesson["number"],
            "title": lesson["title"],
            "slug": lesson["slug"],
        },
        "sourceMethod": "final-video",
        "sourceVideo": {
            "path": str(prepared.video),
            "sha256": prepared.video_sha256,
            "bytes": prepared.video_bytes,
            **prepared.media,
        },
        "transcriptSource": str(prepared.transcript),
        "images": image_paths,
        "captures": capture_records,
    }
    manifest_path = prepared.output_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    content_path = prepared.output_dir / "content.md"
    if not content_path.exists():
        lines = [f"# {lesson['title']}", ""]
        for capture in capture_records:
            lines.extend(
                [
                    str(capture["brief"]),
                    "",
                    f"![{capture['brief']}]({capture['image']})",
                    "",
                ]
            )
        content_path.write_text("\n".join(lines), encoding="utf-8")
    return manifest_path


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", required=True, type=Path)
    parser.add_argument(
        "--force", action="store_true", help="Replace generated evidence, never content.md"
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    config_path = args.config.expanduser().resolve()
    if not config_path.is_file():
        raise ValueError(f"Config does not exist: {config_path}")
    for tool in ("ffmpeg", "ffprobe"):
        if not shutil.which(tool):
            raise ValueError(f"Required tool is missing: {tool}")
    course, lessons = prepare(config_path, args.force)
    for lesson in lessons:
        print(write_package(course, lesson))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, json.JSONDecodeError, subprocess.CalledProcessError) as error:
        detail = error.stderr.strip() if isinstance(error, subprocess.CalledProcessError) else str(error)
        print(f"error: {detail}", file=sys.stderr)
        raise SystemExit(1) from error

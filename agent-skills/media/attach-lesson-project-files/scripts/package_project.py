#!/usr/bin/env python3
"""Create a deterministic, source-only ZIP for a lesson project."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import stat
import sys
import zipfile
from dataclasses import dataclass
from pathlib import Path, PurePosixPath


FIXED_ZIP_TIME = (1980, 1, 1, 0, 0, 0)
EXCLUDED_PARTS = {
    ".git",
    ".next",
    ".nuxt",
    ".parcel-cache",
    ".turbo",
    ".vercel",
    "__MACOSX",
    "build",
    "coverage",
    "dist",
    "node_modules",
}
EXCLUDED_NAMES = {".DS_Store", ".npmrc", ".yarnrc"}
ALLOWED_ENV_EXAMPLES = {".env.example", ".env.sample", ".env.template"}
SENSITIVE_SUFFIXES = {".key", ".p12", ".pem"}
TEXT_SCAN_LIMIT = 2 * 1024 * 1024
SECRET_PATTERNS = [
    ("private key", re.compile(rb"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----")),
    ("AWS access key", re.compile(rb"\bAKIA[0-9A-Z]{16}\b")),
    ("GitHub token", re.compile(rb"\bgh[pousr]_[A-Za-z0-9]{20,}\b")),
    ("Stripe secret key", re.compile(rb"\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b")),
    ("service-account private key", re.compile(rb'"private_key"\s*:\s*"-----BEGIN')),
]


@dataclass(frozen=True)
class PackageFile:
    source: Path
    archive_path: PurePosixPath


def is_environment_secret(name: str) -> bool:
    return name == ".env" or (name.startswith(".env.") and name not in ALLOWED_ENV_EXAMPLES)


def exclusion_reason(relative_path: Path) -> str | None:
    if any(part in EXCLUDED_PARTS for part in relative_path.parts):
        return "generated or transport-only directory"
    if relative_path.name in EXCLUDED_NAMES:
        return "transport metadata or credential-bearing config"
    if is_environment_secret(relative_path.name):
        return "environment file"
    if relative_path.suffix.lower() in SENSITIVE_SUFFIXES:
        return "credential-like file"
    if relative_path.name.lower().startswith(("service-account", "service_account", "credentials")):
        return "credential-like file"
    return None


def scan_for_secrets(file_path: Path) -> None:
    if file_path.stat().st_size > TEXT_SCAN_LIMIT:
        return
    data = file_path.read_bytes()
    if b"\x00" in data:
        return
    for label, pattern in SECRET_PATTERNS:
        if pattern.search(data):
            raise ValueError(f"Refusing to package suspected {label} in {file_path}")


def collect_directory(
    source_dir: Path, root_name: str, output: Path
) -> tuple[list[PackageFile], list[dict[str, str]]]:
    if output == source_dir or source_dir in output.parents:
        raise ValueError("Output ZIP must be outside the source directory")

    files: list[PackageFile] = []
    excluded: list[dict[str, str]] = []
    for current_root, directory_names, file_names in os.walk(
        source_dir, topdown=True, followlinks=False
    ):
        current = Path(current_root)
        kept_directories: list[str] = []
        for directory_name in sorted(directory_names):
            candidate = current / directory_name
            relative = candidate.relative_to(source_dir)
            reason = exclusion_reason(relative)
            if reason:
                excluded.append({"path": relative.as_posix(), "reason": reason})
                continue
            if candidate.is_symlink():
                raise ValueError(f"Refusing to package symlink {candidate}")
            kept_directories.append(directory_name)
        directory_names[:] = kept_directories

        for file_name in sorted(file_names):
            candidate = current / file_name
            relative = candidate.relative_to(source_dir)
            reason = exclusion_reason(relative)
            if reason:
                excluded.append({"path": relative.as_posix(), "reason": reason})
                continue
            if candidate.is_symlink():
                raise ValueError(f"Refusing to package symlink {candidate}")
            scan_for_secrets(candidate)
            files.append(PackageFile(candidate, PurePosixPath(root_name, *relative.parts)))
    return files, excluded


def collect_explicit(
    source_files: list[Path], root_name: str
) -> tuple[list[PackageFile], list[dict[str, str]]]:
    files: list[PackageFile] = []
    archive_names: set[str] = set()
    excluded: list[dict[str, str]] = []
    for candidate in source_files:
        if candidate.is_symlink():
            raise ValueError(f"Refusing to package symlink {candidate}")
        if not candidate.is_file():
            raise ValueError(f"Source file does not exist: {candidate}")
        reason = exclusion_reason(Path(candidate.name))
        if reason:
            excluded.append({"path": str(candidate), "reason": reason})
            continue
        if candidate.name in archive_names:
            raise ValueError(f"Duplicate basename in explicit files: {candidate.name}")
        scan_for_secrets(candidate)
        archive_names.add(candidate.name)
        files.append(PackageFile(candidate, PurePosixPath(root_name, candidate.name)))
    return files, excluded


def write_package(files: list[PackageFile], output: Path) -> dict[str, object]:
    if not files:
        raise ValueError("No distributable source files remain after exclusions")

    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(
        output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9
    ) as archive:
        for package_file in sorted(files, key=lambda item: item.archive_path.as_posix()):
            info = zipfile.ZipInfo(package_file.archive_path.as_posix(), FIXED_ZIP_TIME)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.create_system = 3
            source_mode = package_file.source.stat().st_mode
            permissions = 0o755 if source_mode & stat.S_IXUSR else 0o644
            info.external_attr = (stat.S_IFREG | permissions) << 16
            archive.writestr(
                info,
                package_file.source.read_bytes(),
                compress_type=zipfile.ZIP_DEFLATED,
                compresslevel=9,
            )

    data = output.read_bytes()
    ordered = sorted(files, key=lambda item: item.archive_path.as_posix())
    return {
        "output": str(output),
        "bytes": len(data),
        "sha256": hashlib.sha256(data).hexdigest(),
        "fileCount": len(files),
        "files": [item.archive_path.as_posix() for item in ordered],
    }


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    source_group = parser.add_mutually_exclusive_group(required=True)
    source_group.add_argument("--source", type=Path, help="Project directory to package")
    source_group.add_argument(
        "--file",
        action="append",
        type=Path,
        dest="files",
        help="Verified source file; repeat as needed",
    )
    parser.add_argument("--root-name", required=True, help="Top-level folder name inside the ZIP")
    parser.add_argument("--output", required=True, type=Path, help="Destination .zip path")
    return parser.parse_args(argv)


def normalized_root_name(value: str) -> str:
    normalized = re.sub(r"[^A-Za-z0-9._-]+", "-", value.strip()).strip("-.")
    if not normalized or normalized in {".", ".."}:
        raise ValueError("Root name must contain a safe filename character")
    return normalized


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    root_name = normalized_root_name(args.root_name)
    output = args.output.expanduser().resolve()

    if output.suffix.lower() != ".zip":
        raise ValueError("Output must use the .zip extension")
    if args.source:
        source = args.source.expanduser().resolve()
        if not source.is_dir():
            raise ValueError(f"Source directory does not exist: {source}")
        files, excluded = collect_directory(source, root_name, output)
    else:
        files, excluded = collect_explicit(
            [item.expanduser().resolve() for item in args.files], root_name
        )

    result = write_package(files, output)
    result["excluded"] = excluded
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, zipfile.BadZipFile) as error:
        print(f"error: {error}", file=sys.stderr)
        raise SystemExit(1) from error

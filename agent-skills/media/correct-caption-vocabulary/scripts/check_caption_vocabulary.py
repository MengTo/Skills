#!/usr/bin/env python3
"""Report or apply deterministic caption corrections from a supplied glossary."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path


ALLOWED_INPUT_SUFFIXES = {"", ".md", ".srt", ".txt", ".vtt"}


@dataclass(frozen=True)
class Alias:
    canonical: str
    text: str
    case_sensitive: bool


def load_glossary(path: Path) -> list[Alias]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    terms = payload.get("terms") if isinstance(payload, dict) else None
    if not isinstance(terms, list) or not terms:
        raise ValueError("Glossary must contain a non-empty terms array")

    aliases: list[Alias] = []
    owners: dict[str, str] = {}
    for index, term in enumerate(terms):
        if not isinstance(term, dict):
            raise ValueError(f"terms[{index}] must be an object")
        canonical = term.get("canonical")
        variants = term.get("aliases")
        case_sensitive = term.get("caseSensitive", False)
        if not isinstance(canonical, str) or not canonical.strip():
            raise ValueError(f"terms[{index}].canonical must be a non-empty string")
        if not isinstance(variants, list) or not all(
            isinstance(item, str) and item.strip() for item in variants
        ):
            raise ValueError(f"terms[{index}].aliases must be an array of non-empty strings")
        if not isinstance(case_sensitive, bool):
            raise ValueError(f"terms[{index}].caseSensitive must be true or false")
        canonical = canonical.strip()
        for raw_alias in [canonical, *variants]:
            alias = raw_alias.strip()
            normalized = alias.casefold()
            owner = owners.get(normalized)
            if owner is not None and owner != canonical:
                raise ValueError(
                    f"Alias {alias!r} maps to both {owner!r} and {canonical!r}"
                )
            owners[normalized] = canonical
            candidate = Alias(canonical, alias, case_sensitive)
            if candidate not in aliases:
                aliases.append(candidate)
    return sorted(aliases, key=lambda item: len(item.text), reverse=True)


def compile_pattern(aliases: list[Alias]) -> tuple[re.Pattern[str], dict[str, Alias]]:
    groups: list[str] = []
    alias_by_group: dict[str, Alias] = {}
    for index, alias in enumerate(aliases):
        group = f"alias{index}"
        expression = re.escape(alias.text)
        if not alias.case_sensitive:
            expression = f"(?i:{expression})"
        groups.append(f"(?P<{group}>{expression})")
        alias_by_group[group] = alias
    pattern = re.compile(r"(?<![A-Za-z0-9])(?:" + "|".join(groups) + r")(?![A-Za-z0-9])")
    return pattern, alias_by_group


def correct(text: str, aliases: list[Alias]) -> tuple[str, list[dict[str, object]]]:
    pattern, alias_by_group = compile_pattern(aliases)
    changes: list[dict[str, object]] = []

    def replace(match: re.Match[str]) -> str:
        group = match.lastgroup
        assert group is not None
        alias = alias_by_group[group]
        original = match.group(0)
        if original == alias.canonical:
            return original
        changes.append(
            {
                "original": original,
                "canonical": alias.canonical,
                "start": match.start(),
                "end": match.end(),
            }
        )
        return alias.canonical

    return pattern.sub(replace, text), changes


def read_source(args: argparse.Namespace) -> tuple[str, str]:
    if args.input:
        path = args.input.expanduser().resolve()
        if not path.is_file():
            raise ValueError(f"Input does not exist: {path}")
        if path.suffix.lower() not in ALLOWED_INPUT_SUFFIXES:
            raise ValueError("Input must be detached text, Markdown, SRT, or VTT")
        return path.read_text(encoding="utf-8"), str(path)
    if args.text is not None:
        return args.text, "command text"
    return sys.stdin.read(), "standard input"


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--glossary", required=True, type=Path)
    source = parser.add_mutually_exclusive_group()
    source.add_argument("--input", type=Path)
    source.add_argument("--text")
    parser.add_argument("--format", choices=("json", "text"), default="json")
    parser.add_argument("--apply", action="store_true", help="Write a reviewed corrected copy")
    parser.add_argument("--output", type=Path)
    parser.add_argument("--force", action="store_true", help="Replace an existing output file")
    args = parser.parse_args(argv)
    if args.apply and args.output is None:
        parser.error("--apply requires --output")
    if args.output is not None and not args.apply:
        parser.error("--output requires --apply")
    return args


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    glossary_path = args.glossary.expanduser().resolve()
    if not glossary_path.is_file():
        raise ValueError(f"Glossary does not exist: {glossary_path}")
    aliases = load_glossary(glossary_path)
    source_text, source_identity = read_source(args)
    corrected, changes = correct(source_text, aliases)

    output_identity: str | None = None
    if args.apply:
        output = args.output.expanduser().resolve()
        if output.exists() and not args.force:
            raise ValueError(f"Output already exists; use --force to replace it: {output}")
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(corrected, encoding="utf-8")
        output_identity = str(output)

    if args.format == "text":
        print(corrected, end="" if corrected.endswith("\n") else "\n")
    else:
        print(
            json.dumps(
                {
                    "source": source_identity,
                    "changed": bool(changes),
                    "correctionCount": len(changes),
                    "corrections": changes,
                    "correctedText": corrected,
                    "output": output_identity,
                },
                ensure_ascii=False,
                indent=2,
            )
        )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, json.JSONDecodeError, UnicodeDecodeError) as error:
        print(f"error: {error}", file=sys.stderr)
        raise SystemExit(2) from error

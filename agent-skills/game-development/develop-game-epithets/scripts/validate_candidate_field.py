#!/usr/bin/env python3
"""Validate hard lexical constraints across a proposed candidate field."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass


@dataclass
class Violation:
    candidate: str
    issue: str
    term: str | None = None


def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def contains(candidate: str, term: str, mode: str) -> bool:
    if mode == "substring":
        return term.casefold() in candidate.casefold()
    words = re.findall(r"[^\W_]+", candidate.casefold(), flags=re.UNICODE)
    return term.casefold() in words


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Check candidate count, uniqueness, and required or banned terms. "
            "Reads non-empty newline-delimited candidates from stdin when no "
            "positional candidates are provided."
        )
    )
    parser.add_argument("candidates", nargs="*", help="Candidate names")
    parser.add_argument(
        "--require",
        action="append",
        default=[],
        metavar="TERM",
        help="Term every candidate must contain; repeat as needed",
    )
    parser.add_argument(
        "--ban",
        action="append",
        default=[],
        metavar="TERM",
        help="Term no candidate may contain; repeat as needed",
    )
    parser.add_argument(
        "--min-count",
        type=int,
        default=30,
        help="Minimum number of unique candidates (default: 30)",
    )
    parser.add_argument(
        "--match",
        choices=("substring", "word"),
        default="substring",
        help="Constraint matching mode (default: substring)",
    )
    parser.add_argument(
        "--format",
        choices=("text", "json"),
        default="text",
        help="Output format (default: text)",
    )
    return parser.parse_args()


def read_candidates(args: argparse.Namespace) -> list[str]:
    raw = args.candidates
    if not raw and not sys.stdin.isatty():
        raw = sys.stdin.read().splitlines()
    return [normalized for value in raw if (normalized := normalize(value))]


def validate(
    candidates: list[str],
    required: list[str],
    banned: list[str],
    min_count: int,
    mode: str,
) -> list[Violation]:
    violations: list[Violation] = []
    seen: dict[str, str] = {}

    for candidate in candidates:
        key = candidate.casefold()
        if key in seen:
            violations.append(
                Violation(candidate, f"duplicate of {seen[key]!r}")
            )
        else:
            seen[key] = candidate

        for term in required:
            if not contains(candidate, term, mode):
                violations.append(candidate_violation(candidate, "missing required term", term))
        for term in banned:
            if contains(candidate, term, mode):
                violations.append(candidate_violation(candidate, "contains banned term", term))

    if len(seen) < min_count:
        violations.append(
            Violation(
                "<field>",
                f"only {len(seen)} unique candidates; minimum is {min_count}",
            )
        )
    return violations


def candidate_violation(candidate: str, issue: str, term: str) -> Violation:
    return Violation(candidate=candidate, issue=issue, term=term)


def main() -> int:
    args = parse_args()
    if args.min_count < 1:
        print("--min-count must be at least 1", file=sys.stderr)
        return 2

    candidates = read_candidates(args)
    if not candidates:
        print("No candidates supplied", file=sys.stderr)
        return 2

    violations = validate(
        candidates,
        required=[normalize(term) for term in args.require if normalize(term)],
        banned=[normalize(term) for term in args.ban if normalize(term)],
        min_count=args.min_count,
        mode=args.match,
    )

    if args.format == "json":
        print(
            json.dumps(
                {
                    "passed": not violations,
                    "candidate_count": len(candidates),
                    "unique_count": len({value.casefold() for value in candidates}),
                    "violations": [asdict(item) for item in violations],
                },
                indent=2,
                ensure_ascii=False,
            )
        )
    elif violations:
        print("Candidate field failed:")
        for item in violations:
            suffix = f": {item.term}" if item.term else ""
            print(f"- {item.candidate}: {item.issue}{suffix}")
    else:
        print(
            f"Candidate field passed: {len(candidates)} candidates, "
            f"{len({value.casefold() for value in candidates})} unique."
        )

    return 1 if violations else 0


if __name__ == "__main__":
    raise SystemExit(main())

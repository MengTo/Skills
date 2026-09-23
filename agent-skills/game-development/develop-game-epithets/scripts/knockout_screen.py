#!/usr/bin/env python3
"""Best-effort exact-surface checks for game-name candidates.

This helper is evidence collection, not trademark clearance. It intentionally
does not make availability or legal conclusions.
"""

from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import asdict, dataclass
from typing import Any


USER_AGENT = "Mozilla/5.0 (compatible; CodexNamingScreen/1.0)"


@dataclass
class HttpResult:
    status: int | None
    body: str | None
    error: str | None


@dataclass
class CandidateResult:
    candidate: str
    slug: str
    checked_at: str
    steam_url: str
    steam_match_count: int | None
    itch_url: str
    itch_titles: list[str]
    itch_exact_title: bool
    apple_url: str
    apple_exact_titles: list[str]
    rdap_status: dict[str, int | None]
    handle_status: dict[str, int | None]
    errors: list[str]


def slugify(value: str) -> str:
    return "".join(ch for ch in value.casefold() if ch.isascii() and ch.isalnum())


def fetch(url: str, timeout: float) -> HttpResult:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            charset = response.headers.get_content_charset() or "utf-8"
            body = response.read().decode(charset, errors="replace")
            return HttpResult(response.status, body, None)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        return HttpResult(exc.code, body, None)
    except Exception as exc:  # Network and TLS errors are evidence gaps.
        return HttpResult(None, None, f"{type(exc).__name__}: {exc}")


def parse_steam_count(body: str | None) -> int | None:
    if not body:
        return None
    match = re.search(r"([\d,]+)\s+results?\s+match\s+your\s+search", body, re.I)
    return int(match.group(1).replace(",", "")) if match else None


def parse_itch_titles(body: str | None) -> list[str]:
    if not body:
        return []
    matches = re.findall(
        r'class="game_title">\s*<a[^>]*>([^<]+)</a>',
        body,
        flags=re.I,
    )
    return [html.unescape(re.sub(r"\s+", " ", value)).strip() for value in matches]


def parse_apple_exact(body: str | None, candidate: str) -> list[str]:
    if not body:
        return []
    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        return []
    titles = [
        item.get("trackName", "")
        for item in payload.get("results", [])
        if item.get("trackName", "").casefold() == candidate.casefold()
    ]
    return [title for title in titles if title]


def check_candidate(candidate: str, timeout: float) -> CandidateResult:
    slug = slugify(candidate)
    query = urllib.parse.quote_plus(candidate)
    checked_at = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
    errors: list[str] = []

    steam_url = f"https://store.steampowered.com/search/?term={query}"
    itch_url = f"https://itch.io/search?q={query}"
    apple_url = (
        "https://itunes.apple.com/search?"
        f"term={query}&entity=software&limit=25"
    )

    steam = fetch(steam_url, timeout)
    itch = fetch(itch_url, timeout)
    apple = fetch(apple_url, timeout)

    for label, result in (("steam", steam), ("itch", itch), ("apple", apple)):
        if result.error:
            errors.append(f"{label}: {result.error}")

    itch_titles = parse_itch_titles(itch.body)

    rdap_urls = {
        "com": f"https://rdap.verisign.com/com/v1/domain/{slug}.com",
        "game": f"https://rdap.centralnic.com/game/domain/{slug}.game",
        "games": (
            "https://rdap.identitydigital.services/rdap/domain/"
            f"{slug}.games"
        ),
    }
    rdap_status: dict[str, int | None] = {}
    for label, url in rdap_urls.items():
        result = fetch(url, timeout)
        rdap_status[label] = result.status
        if result.error:
            errors.append(f"rdap_{label}: {result.error}")

    handle_urls = {
        "x": f"https://x.com/{slug}",
        "youtube": f"https://www.youtube.com/@{slug}",
    }
    handle_status: dict[str, int | None] = {}
    for label, url in handle_urls.items():
        result = fetch(url, timeout)
        handle_status[label] = result.status
        if result.error:
            errors.append(f"handle_{label}: {result.error}")

    return CandidateResult(
        candidate=candidate,
        slug=slug,
        checked_at=checked_at,
        steam_url=steam_url,
        steam_match_count=parse_steam_count(steam.body),
        itch_url=itch_url,
        itch_titles=itch_titles,
        itch_exact_title=any(
            title.casefold() == candidate.casefold() for title in itch_titles
        ),
        apple_url=apple_url,
        apple_exact_titles=parse_apple_exact(apple.body, candidate),
        rdap_status=rdap_status,
        handle_status=handle_status,
        errors=errors,
    )


def render_markdown(results: list[CandidateResult]) -> str:
    lines = [
        "| Candidate | Steam count | itch exact | Apple exact | RDAP com/game/games | X/YT route status |",
        "|---|---:|---|---:|---|---|",
    ]
    for result in results:
        rdap = "/".join(
            str(result.rdap_status.get(key) or "error")
            for key in ("com", "game", "games")
        )
        handles = "/".join(
            str(result.handle_status.get(key) or "error")
            for key in ("x", "youtube")
        )
        steam = (
            str(result.steam_match_count)
            if result.steam_match_count is not None
            else "unknown"
        )
        lines.append(
            f"| {result.candidate} | {steam} | "
            f"{'yes' if result.itch_exact_title else 'no'} | "
            f"{len(result.apple_exact_titles)} | {rdap} | {handles} |"
        )

    lines.extend(
        [
            "",
            "Interpretation guardrails:",
            "",
            "- `404` from RDAP means no registry object was returned at check time.",
            "- Store and handle checks are best-effort and may be fuzzy, blocked, or regional.",
            "- X/YouTube status codes are route signals, not handle ownership or availability.",
            "- This output is preliminary evidence, not availability or legal clearance.",
        ]
    )

    errors = [
        f"- {result.candidate}: {error}"
        for result in results
        for error in result.errors
    ]
    if errors:
        lines.extend(["", "Evidence gaps:", "", *errors])
    return "\n".join(lines)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Collect best-effort exact storefront, RDAP, and handle signals."
    )
    parser.add_argument("candidates", nargs="+", help="Candidate names to check")
    parser.add_argument(
        "--timeout",
        type=float,
        default=12.0,
        help="Per-request timeout in seconds (default: 12)",
    )
    parser.add_argument(
        "--format",
        choices=("json", "markdown"),
        default="json",
        help="Output format (default: json)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    invalid = [value for value in args.candidates if not slugify(value)]
    if invalid:
        print(f"Candidates must contain ASCII letters or digits: {invalid}", file=sys.stderr)
        return 2

    results = [check_candidate(value, args.timeout) for value in args.candidates]
    if args.format == "markdown":
        print(render_markdown(results))
    else:
        payload: list[dict[str, Any]] = [asdict(result) for result in results]
        print(json.dumps(payload, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Generate one Atlas Cloud image from a live model schema."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import sys
import time
from typing import Any, Iterable
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


DEFAULT_API_BASE = "https://api.atlascloud.ai"
TRANSIENT_HTTP = {429, 500, 502, 503, 504}
SUCCESS_STATUSES = {"completed", "succeeded", "success"}
FAILURE_STATUSES = {"failed", "canceled", "cancelled"}


class AtlasError(RuntimeError):
    """A sanitized error that is safe to show to the user."""


def walk_objects(value: Any) -> Iterable[dict[str, Any]]:
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk_objects(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk_objects(child)


def model_id(item: dict[str, Any]) -> str | None:
    value = item.get("name") or item.get("id") or item.get("model")
    return value if isinstance(value, str) and value else None


def image_models(catalog: Any) -> list[dict[str, Any]]:
    found: dict[str, dict[str, Any]] = {}
    for item in walk_objects(catalog):
        current_id = model_id(item)
        if not current_id:
            continue
        if str(item.get("type", "")).lower() != "image":
            continue
        if item.get("display_console") is not True:
            continue
        found[current_id] = item
    return [found[key] for key in sorted(found)]


def choose_model(catalog: Any, requested_id: str) -> dict[str, Any]:
    for item in image_models(catalog):
        if model_id(item) == requested_id:
            return item
    raise AtlasError(f"Image model is not visible in the live catalog: {requested_id}")


def schema_url(item: dict[str, Any]) -> str:
    value = item.get("schema") or item.get("schema_url") or item.get("input_schema")
    if not isinstance(value, str) or not value:
        raise AtlasError("Selected model does not expose a schema URL.")
    return value


def safe_http_detail(error: HTTPError) -> str:
    try:
        raw = error.read().decode("utf-8", errors="replace")
    except Exception:
        return ""
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        return raw[:500]
    if isinstance(payload, dict):
        message = payload.get("message") or payload.get("error") or payload.get("detail")
        if isinstance(message, str):
            return message[:500]
        if isinstance(message, dict):
            nested = message.get("message")
            if isinstance(nested, str):
                return nested[:500]
    return "API request failed"


def request_json(
    method: str,
    url: str,
    *,
    api_key: str | None = None,
    payload: dict[str, Any] | None = None,
    get_attempts: int = 4,
    timeout: int = 60,
) -> Any:
    method = method.upper()
    attempts = get_attempts if method == "GET" else 1
    headers = {"Accept": "application/json", "User-Agent": "atlas-image-generation-skill/1.0"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    data = None
    if payload is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(payload).encode("utf-8")

    for attempt in range(attempts):
        request = Request(url, data=data, method=method, headers=headers)
        try:
            with urlopen(request, timeout=timeout) as response:
                return json.loads(response.read().decode("utf-8"))
        except HTTPError as error:
            retryable = method == "GET" and error.code in TRANSIENT_HTTP
            if not retryable or attempt + 1 == attempts:
                detail = safe_http_detail(error)
                suffix = f": {detail}" if detail else ""
                raise AtlasError(f"{method} {url} returned HTTP {error.code}{suffix}") from None
        except (URLError, TimeoutError) as error:
            if method != "GET" or attempt + 1 == attempts:
                if method == "POST":
                    raise AtlasError("Generation POST outcome is ambiguous; it was not retried.") from None
                reason = getattr(error, "reason", error)
                raise AtlasError(f"GET {url} failed after bounded retries: {reason}") from None
        time.sleep(2**attempt)
    raise AtlasError(f"{method} {url} failed.")


def download_image(url: str, output: Path, *, get_attempts: int = 4) -> tuple[str, int]:
    for attempt in range(get_attempts):
        request = Request(url, headers={"User-Agent": "atlas-image-generation-skill/1.0"})
        try:
            with urlopen(request, timeout=90) as response:
                media_type = response.headers.get_content_type()
                content = response.read()
            if not media_type.startswith("image/"):
                raise AtlasError(f"Output URL returned non-image content type: {media_type}")
            if not content:
                raise AtlasError("Output URL returned an empty file.")
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_bytes(content)
            return media_type, len(content)
        except HTTPError as error:
            if error.code not in TRANSIENT_HTTP or attempt + 1 == get_attempts:
                raise AtlasError(f"Image download returned HTTP {error.code}.") from None
        except (URLError, TimeoutError) as error:
            if attempt + 1 == get_attempts:
                reason = getattr(error, "reason", error)
                raise AtlasError(f"Image download failed after bounded retries: {reason}") from None
        time.sleep(2**attempt)
    raise AtlasError("Image download failed.")


def input_schema(schema: dict[str, Any]) -> dict[str, Any]:
    try:
        value = schema["components"]["schemas"]["Input"]
    except (KeyError, TypeError):
        raise AtlasError("Model schema does not define components.schemas.Input.") from None
    if not isinstance(value, dict):
        raise AtlasError("Model Input schema is not an object.")
    return value


def validate_payload(payload: dict[str, Any], schema: dict[str, Any]) -> None:
    spec = input_schema(schema)
    required = set(spec.get("required") or [])
    properties = spec.get("properties") or {}
    allowed = set(properties) | required
    missing = sorted(required - set(payload))
    unsupported = sorted(set(payload) - allowed)
    if missing:
        raise AtlasError(f"Request is missing required schema fields: {', '.join(missing)}")
    if unsupported:
        raise AtlasError(f"Request includes unsupported schema fields: {', '.join(unsupported)}")
    for key, value in payload.items():
        field = properties.get(key)
        if not isinstance(field, dict):
            continue
        enum = field.get("enum")
        if isinstance(enum, list) and value not in enum:
            choices = ", ".join(map(str, enum))
            raise AtlasError(f"{key} must be one of: {choices}")


def endpoint(schema: dict[str, Any], method: str, marker: str) -> str:
    for path, methods in (schema.get("paths") or {}).items():
        if isinstance(methods, dict) and method.lower() in methods and marker in path:
            return path
    raise AtlasError(f"Model schema does not declare a {method.upper()} {marker} endpoint.")


def nested_id(value: Any) -> str | None:
    for item in walk_objects(value):
        current = item.get("id")
        if isinstance(current, str) and current:
            return current
    return None


def status_record(value: Any) -> dict[str, Any]:
    for item in walk_objects(value):
        if isinstance(item.get("status"), str):
            return item
    return value if isinstance(value, dict) else {}


def output_url(value: Any) -> str | None:
    for item in walk_objects(value):
        outputs = item.get("outputs")
        if isinstance(outputs, list):
            for output in outputs:
                if isinstance(output, str) and output.startswith(("https://", "http://")):
                    return output
        for key in ("output", "url"):
            candidate = item.get(key)
            if isinstance(candidate, str) and candidate.startswith(("https://", "http://")):
                return candidate
    return None


def read_prompt(args: argparse.Namespace) -> str:
    if args.prompt:
        value = args.prompt
    elif args.prompt_file:
        value = Path(args.prompt_file).read_text(encoding="utf-8")
    elif not sys.stdin.isatty():
        value = sys.stdin.read()
    else:
        raise AtlasError("Provide --prompt, --prompt-file, or prompt text on stdin.")
    value = value.strip()
    if not value:
        raise AtlasError("Prompt is empty.")
    return value


def parse_json_object(value: str, label: str) -> dict[str, Any]:
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError as error:
        raise AtlasError(f"{label} must be valid JSON: {error}") from error
    if not isinstance(parsed, dict):
        raise AtlasError(f"{label} must decode to a JSON object.")
    return parsed


def parse_params(values: list[str], params_json: str | None) -> dict[str, Any]:
    result = parse_json_object(params_json, "--params-json") if params_json else {}
    for item in values:
        if "=" not in item:
            raise AtlasError("--param must use key=<json-value> syntax.")
        key, raw = item.split("=", 1)
        key = key.strip()
        if not key:
            raise AtlasError("--param key cannot be empty.")
        try:
            result[key] = json.loads(raw)
        except json.JSONDecodeError as error:
            raise AtlasError(f"--param {key} has invalid JSON: {error}") from error
    return result


def build_payload(model: str, prompt: str, options: dict[str, Any]) -> dict[str, Any]:
    reserved = sorted({"model", "prompt"} & set(options))
    if reserved:
        raise AtlasError(f"Model options cannot override reserved fields: {', '.join(reserved)}")
    return {"model": model, "prompt": prompt, **options}


def default_output() -> Path:
    stamp = time.strftime("%Y%m%d-%H%M%S")
    return Path("outputs") / "atlas-images" / f"atlas-image-{stamp}.png"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generate one Atlas Cloud image from a live model schema.")
    parser.add_argument("--list-models", action="store_true", help="List visible live image models and exit.")
    parser.add_argument("--model", help="Exact model ID returned by --list-models.")
    parser.add_argument("--prompt", help="Image prompt.")
    parser.add_argument("--prompt-file", help="UTF-8 prompt file.")
    parser.add_argument("--param", action="append", default=[], help="Model option as key=<json-value>.")
    parser.add_argument("--params-json", help="JSON object of model-specific options.")
    parser.add_argument("--output", help="Downloaded image path.")
    parser.add_argument("--poll-interval", type=float, default=4.0, help="Seconds between result GETs.")
    parser.add_argument("--max-polls", type=int, default=30, help="Maximum result GET attempts.")
    parser.add_argument("--dry-run", action="store_true", help="Validate and print the request without POSTing.")
    parser.add_argument("--json", action="store_true", help="Print machine-readable JSON.")
    parser.add_argument("--api-base", default=os.getenv("ATLASCLOUD_MEDIA_API_BASE", DEFAULT_API_BASE))
    return parser


def emit(result: dict[str, Any], as_json: bool) -> None:
    if as_json:
        print(json.dumps(result, indent=2, sort_keys=True))
        return
    for key, value in result.items():
        print(f"{key}: {value}")


def main() -> int:
    args = build_parser().parse_args()
    if args.max_polls < 1:
        raise AtlasError("--max-polls must be at least 1.")
    if args.poll_interval < 0:
        raise AtlasError("--poll-interval cannot be negative.")
    base = args.api_base.rstrip("/")
    catalog = request_json("GET", f"{base}/api/v1/models")
    visible_models = image_models(catalog)

    if args.list_models:
        rows = [{"id": model_id(item), "schema": schema_url(item)} for item in visible_models]
        if args.json:
            print(json.dumps(rows, indent=2, sort_keys=True))
        else:
            for row in rows:
                print(f"{row['id']}\t{row['schema']}")
        return 0

    if not args.model:
        raise AtlasError("Select an exact live image model with --model.")
    prompt = read_prompt(args)
    selected = choose_model(catalog, args.model)
    schema = request_json("GET", schema_url(selected))
    options = parse_params(args.param, args.params_json)
    payload = build_payload(args.model, prompt, options)
    validate_payload(payload, schema)
    post_path = endpoint(schema, "POST", "generateImage")
    result_path = endpoint(schema, "GET", "{request_id}")
    output = Path(args.output) if args.output else default_output()

    if args.dry_run:
        emit(
            {
                "status": "dry-run",
                "model": args.model,
                "output": str(output),
                "payload": payload,
                "post_path": post_path,
                "result_path": result_path,
            },
            args.json,
        )
        return 0

    api_key = os.getenv("ATLASCLOUD_API_KEY") or os.getenv("ATLAS_CLOUD_API_KEY")
    if not api_key:
        raise AtlasError("Missing ATLASCLOUD_API_KEY in the environment.")

    submitted = request_json("POST", f"{base}{post_path}", api_key=api_key, payload=payload, timeout=90)
    request_id = nested_id(submitted)
    if not request_id:
        raise AtlasError("Generation POST returned no request ID; it was not retried.")

    last_status = "unknown"
    result: Any = None
    for attempt in range(args.max_polls):
        result = request_json(
            "GET",
            f"{base}{result_path.replace('{request_id}', request_id)}",
            api_key=api_key,
        )
        record = status_record(result)
        last_status = str(record.get("status", "unknown")).lower()
        if last_status in SUCCESS_STATUSES | FAILURE_STATUSES:
            break
        if attempt + 1 < args.max_polls:
            time.sleep(args.poll_interval)
    else:
        raise AtlasError(f"Polling limit reached; request {request_id} has unknown final status.")

    if last_status not in SUCCESS_STATUSES:
        record = status_record(result)
        message = record.get("error") or record.get("message") or "provider reported failure"
        raise AtlasError(f"Generation {request_id} ended with {last_status}: {message}")

    remote_url = output_url(result)
    if not remote_url:
        raise AtlasError(f"Generation {request_id} completed without an image URL.")
    media_type, size_bytes = download_image(remote_url, output)
    emit(
        {
            "status": "completed",
            "request_id": request_id,
            "model": args.model,
            "output": str(output),
            "media_type": media_type,
            "bytes": size_bytes,
        },
        args.json,
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AtlasError as error:
        print(f"error: {error}", file=sys.stderr)
        raise SystemExit(1)

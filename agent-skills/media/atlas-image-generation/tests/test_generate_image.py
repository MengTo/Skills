from __future__ import annotations

import importlib.util
import io
import json
from pathlib import Path
import sys
import unittest
from unittest.mock import patch
from urllib.error import HTTPError, URLError


SCRIPT = Path(__file__).parents[1] / "scripts" / "generate_image.py"
SPEC = importlib.util.spec_from_file_location("generate_image", SCRIPT)
assert SPEC and SPEC.loader
generate_image = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = generate_image
SPEC.loader.exec_module(generate_image)


class FakeHeaders:
    def get_content_type(self) -> str:
        return "application/json"


class FakeResponse:
    def __init__(self, payload: object):
        self.payload = payload
        self.headers = FakeHeaders()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, traceback):
        return False

    def read(self) -> bytes:
        return json.dumps(self.payload).encode()


class GenerateImageTests(unittest.TestCase):
    def test_parser_ignores_chat_api_base_environment_variable(self):
        with patch.dict(
            generate_image.os.environ,
            {"ATLASCLOUD_API_BASE": "https://chat.example/v1"},
            clear=True,
        ):
            parser = generate_image.build_parser()
        self.assertEqual(parser.get_default("api_base"), generate_image.DEFAULT_API_BASE)

    def test_image_models_returns_only_visible_image_entries(self):
        catalog = {
            "data": [
                {"name": "visible/image", "type": "Image", "display_console": True, "schema": "https://schema"},
                {"name": "hidden/image", "type": "Image", "display_console": False, "schema": "https://schema"},
                {"name": "visible/video", "type": "Video", "display_console": True, "schema": "https://schema"},
            ]
        }
        self.assertEqual([generate_image.model_id(item) for item in generate_image.image_models(catalog)], ["visible/image"])

    def test_validate_payload_uses_required_and_properties(self):
        schema = {
            "components": {
                "schemas": {
                    "Input": {
                        "required": ["model", "prompt"],
                        "properties": {"prompt": {"type": "string"}, "size": {"enum": ["square"]}},
                    }
                }
            }
        }
        generate_image.validate_payload({"model": "visible/image", "prompt": "test", "size": "square"}, schema)
        with self.assertRaisesRegex(generate_image.AtlasError, "unsupported"):
            generate_image.validate_payload({"model": "visible/image", "prompt": "test", "seed": 1}, schema)
        with self.assertRaisesRegex(generate_image.AtlasError, "must be one of"):
            generate_image.validate_payload({"model": "visible/image", "prompt": "test", "size": "wide"}, schema)

    def test_model_options_cannot_replace_model_or_prompt(self):
        options = generate_image.parse_params([], '{"model":"other","size":"square"}')
        with self.assertRaisesRegex(generate_image.AtlasError, "reserved fields: model"):
            generate_image.build_payload("visible/image", "test", options)

    def test_post_network_failure_is_not_retried(self):
        with patch.object(generate_image, "urlopen", side_effect=URLError("timeout")) as mocked:
            with self.assertRaisesRegex(generate_image.AtlasError, "not retried"):
                generate_image.request_json("POST", "https://api/generate", payload={"prompt": "test"})
        self.assertEqual(mocked.call_count, 1)

    def test_get_transient_failure_retries_with_bound(self):
        error = HTTPError("https://api/result", 503, "busy", {}, io.BytesIO(b'{"message":"busy"}'))
        with patch.object(generate_image, "urlopen", side_effect=[error, FakeResponse({"status": "completed"})]) as mocked:
            with patch.object(generate_image.time, "sleep"):
                result = generate_image.request_json("GET", "https://api/result", get_attempts=3)
        self.assertEqual(result["status"], "completed")
        self.assertEqual(mocked.call_count, 2)

    def test_endpoint_and_output_discovery_follow_schema_and_result(self):
        schema = {
            "paths": {
                "/api/v1/model/generateImage": {"post": {}},
                "/api/v1/model/result/{request_id}": {"get": {}},
            }
        }
        self.assertEqual(generate_image.endpoint(schema, "POST", "generateImage"), "/api/v1/model/generateImage")
        self.assertEqual(
            generate_image.endpoint(schema, "GET", "{request_id}"),
            "/api/v1/model/result/{request_id}",
        )
        self.assertEqual(generate_image.output_url({"data": {"outputs": ["https://cdn/image.png"]}}), "https://cdn/image.png")


if __name__ == "__main__":
    unittest.main()

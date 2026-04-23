"""Thin wrappers over google-genai for Gemini text + Imagen image generation."""
from __future__ import annotations

import json
import threading
import uuid
from typing import Any

from api.config import settings
from api.paths import GENERATED_DIR

# Process-wide singleton. Building a fresh genai.Client per call leaks/closes
# the underlying httpx pool and breaks subsequent calls with
# "Cannot send a request, as the client has been closed."
_client_lock = threading.Lock()
_cached_client = None


def _client():
    global _cached_client
    if _cached_client is None:
        with _client_lock:
            if _cached_client is None:
                from google import genai
                if not settings.google_ai_api_key:
                    raise RuntimeError("GOOGLE_AI_API_KEY not set")
                # Force the AI Studio (Gemini API) backend — the SDK otherwise
                # auto-selects Vertex AI when GOOGLE_CLOUD_PROJECT / ADC are
                # present in the environment, which rejects API-key auth.
                _cached_client = genai.Client(
                    api_key=settings.google_ai_api_key,
                    vertexai=False,
                )
    return _cached_client


def reset_client() -> None:
    """Test hook: drop the cached client so the next _client() call rebuilds it."""
    global _cached_client
    with _client_lock:
        _cached_client = None


def gemini_text(prompt: str, model: str = "gemini-2.5-flash",
                system: str | None = None, json_mode: bool = False) -> str:
    from google.genai import types
    cfg = types.GenerateContentConfig(
        system_instruction=system,
        response_mime_type="application/json" if json_mode else None,
    )
    resp = _client().models.generate_content(model=model, contents=prompt, config=cfg)
    return resp.text or ""


def gemini_vision(image_bytes: bytes, mime: str, prompt: str,
                  model: str = "gemini-2.5-flash", json_mode: bool = True) -> str:
    from google.genai import types
    cfg = types.GenerateContentConfig(
        response_mime_type="application/json" if json_mode else None,
    )
    img = types.Part.from_bytes(data=image_bytes, mime_type=mime)
    resp = _client().models.generate_content(
        model=model, contents=[prompt, img], config=cfg,
    )
    return resp.text or ""


def imagen_generate(prompt: str, n: int = 3,
                    model: str = "imagen-3.0-generate-001") -> list[str]:
    """Returns list of local file URLs under /generated/. Saves PNGs for serving."""
    from google.genai import types
    resp = _client().models.generate_images(
        model=model, prompt=prompt,
        config=types.GenerateImagesConfig(number_of_images=n),
    )
    urls: list[str] = []
    for img in resp.generated_images or []:
        raw = img.image.image_bytes
        fn = f"{uuid.uuid4().hex}.png"
        (GENERATED_DIR / fn).write_bytes(raw)
        urls.append(f"/generated/{fn}")
    return urls


def parse_json_safe(text: str) -> Any:
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        text = text.split("\n", 1)[1] if "\n" in text else text
        text = text.rsplit("```", 1)[0] if "```" in text else text
    return json.loads(text)

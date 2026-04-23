"""Model Router. Unified interface over Google + OpenAI-compat providers."""
from __future__ import annotations

import logging
from typing import Any

from api.config import settings

log = logging.getLogger(__name__)

MODEL_REGISTRY: dict[str, dict[str, Any]] = {
    # ── IMAGE ──
    "imagen-3.0-generate-001": {
        "type": "image", "client": "google",
        "prompt_format": "natural_language", "supports_n": True,
        "requires": "google_ai_api_key",
    },
    "replicate/flux-schnell": {
        "type": "image", "client": "openai_compat",
        "base_url": "https://api.replicate.com/v1",
        "prompt_format": "natural_language", "supports_n": False,
        "requires": "replicate_api_token",
    },
    "openai/dall-e-3": {
        "type": "image", "client": "openai_compat",
        "base_url": "https://api.openai.com/v1",
        "prompt_format": "natural_language", "supports_n": False,
        "requires": "openai_api_key",
    },
    "local/stable-diffusion": {
        "type": "image", "client": "openai_compat",
        "base_url": settings.sd_base_url,
        "prompt_format": "tag_comma", "supports_n": True,
        "requires": None,
    },
    # ── VIDEO ──
    "luma/dream-machine": {
        "type": "video", "client": "openai_compat",
        "base_url": "https://api.lumalabs.ai/dream-machine/v1",
        "requires": "luma_api_key",
    },
    "kling/kling-v1": {
        "type": "video", "client": "openai_compat",
        "base_url": "https://api.kling.ai/v1",
        "requires": "kling_api_key",
    },
    "runway/gen3-alpha-turbo": {
        "type": "video", "client": "openai_compat",
        "base_url": "https://api.dev.runwayml.com/v1",
        "requires": "runway_api_key",
    },
    # ── TEXT ──
    "gemini-2.5-flash": {
        "type": "text", "client": "google", "api": "gemini",
        "supports_vision": True, "requires": "google_ai_api_key",
    },
    "local/llama3": {
        "type": "text", "client": "openai_compat",
        "base_url": settings.ollama_base_url,
        "supports_vision": False, "requires": None,
    },
}


def available_models(kind: str | None = None) -> list[dict[str, Any]]:
    out = []
    for name, meta in MODEL_REGISTRY.items():
        if kind and meta["type"] != kind:
            continue
        req = meta.get("requires")
        if req and not getattr(settings, req, ""):
            continue
        out.append({"name": name, **meta})
    return out


class ModelRouter:
    def __init__(self) -> None:
        self.registry = MODEL_REGISTRY

    def get(self, name: str) -> dict[str, Any]:
        if name not in self.registry:
            raise ValueError(f"Unknown model: {name}")
        return self.registry[name]

    def generate_image(self, model: str, prompt: str, n: int = 1) -> list[str]:
        """Returns list of image URLs. Uses Imagen when key is set, mocks otherwise."""
        meta = self.get(model)
        if meta["type"] != "image":
            raise ValueError(f"{model} is not an image model")
        if meta.get("client") == "google" and settings.google_ai_api_key:
            from .google_client import imagen_generate
            try:
                return imagen_generate(prompt, n=n, model=model)
            except Exception as e:
                log.warning("Imagen call failed, falling back to mock: %s", e)
        return [f"https://picsum.photos/seed/{model.replace('/', '-')}-{i}/1024" for i in range(n)]

    def generate_video(self, model: str, image_url: str, prompt: str) -> str:
        """Returns video URL. TODO: wire real providers."""
        meta = self.get(model)
        if meta["type"] != "video":
            raise ValueError(f"{model} is not a video model")
        return f"https://example.com/mock-video/{model.replace('/', '-')}.mp4"

"""Image generation + regeneration loop."""
from __future__ import annotations

from typing import Any

from modules.model_router import ModelRouter
from modules.prompt_engineer import build_image_prompt, build_improvement_prompt


def generate_variants(
    vision_json: dict[str, Any],
    style_injection: str,
    user_changes: list[str],
    model: str,
    n: int = 3,
) -> list[dict[str, Any]]:
    prompt = build_image_prompt(vision_json, style_injection, user_changes, model)
    router = ModelRouter()
    urls = router.generate_image(model, prompt, n=n)
    return [{"url": u, "prompt": prompt, "model": model, "parent_id": None} for u in urls]


def improve_variant(
    original_vision_json: dict[str, Any],
    improvement_note: str,
    previous_prompt: str,
    model: str,
) -> dict[str, Any]:
    prompt = build_improvement_prompt(original_vision_json, improvement_note, previous_prompt)
    url = ModelRouter().generate_image(model, prompt, n=1)[0]
    return {"url": url, "prompt": prompt, "model": model}

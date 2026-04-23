"""Prompt Engineering Layer. Builds enriched prompts from VisionStruct JSON."""
from __future__ import annotations

from typing import Any

from modules.model_router import MODEL_REGISTRY


def _fidelity_block(vision: dict[str, Any]) -> str:
    palette = ", ".join(vision.get("color_palette", {}).get("dominant_hex_estimates", []))
    comp = vision.get("composition", {})
    light = vision.get("global_context", {}).get("lighting", {})
    parts = [
        f"Portrait card, dominant palette {palette}" if palette else "Portrait card",
        f"framing: {comp.get('framing')}" if comp.get("framing") else None,
        f"focal point: {comp.get('focal_point')}" if comp.get("focal_point") else None,
        f"lighting: {light.get('direction')} {light.get('quality')}" if light else None,
    ]
    return ", ".join(p for p in parts if p)


def _objects_block(vision: dict[str, Any]) -> str:
    objs = vision.get("objects") or []
    descs = []
    for o in objs:
        attrs = o.get("visual_attributes", {}) or {}
        descs.append(
            f"{o.get('label', 'element')} ({o.get('location', 'unspecified')}, "
            f"{attrs.get('color', '')} {attrs.get('texture', '')})".strip()
        )
    return "; ".join(descs)


def _format_for_model(prompt: str, model: str) -> str:
    meta = MODEL_REGISTRY.get(model, {})
    fmt = meta.get("prompt_format", "natural_language")
    if fmt == "tag_comma":
        return ", ".join(p.strip() for p in prompt.split(".") if p.strip())
    return prompt


def build_image_prompt(
    vision_json: dict[str, Any],
    style_injection: str,
    user_changes: list[str],
    target_model: str,
) -> str:
    fidelity = _fidelity_block(vision_json)
    objects = _objects_block(vision_json)
    changes = ". ".join(user_changes) if user_changes else ""
    body = (
        f"{fidelity}. Elements: {objects}. Style: {style_injection}."
        + (f" Changes: {changes}." if changes else "")
    )
    return _format_for_model(body, target_model)


def build_animation_prompt(
    vision_json: dict[str, Any],
    animation_style: str,
    user_description: str = "",
) -> str:
    light = vision_json.get("global_context", {}).get("lighting", {})
    rels = "; ".join(vision_json.get("semantic_relationships", []))
    parts = [
        f"Animate image respecting depth: {rels}" if rels else "Animate image",
        f"light source {light.get('direction')}" if light else None,
        f"animation style: {animation_style}",
        user_description.strip() or None,
    ]
    return ". ".join(p for p in parts if p)


def build_improvement_prompt(
    original_vision_json: dict[str, Any],
    improvement_note: str,
    previous_prompt: str,
) -> str:
    return (
        f"{previous_prompt}\n\nTargeted improvement (change ONLY this aspect, "
        f"preserve everything else): {improvement_note}"
    )

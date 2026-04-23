"""Animation planner + executor."""
from __future__ import annotations

import json
import logging
from typing import Any

from api.config import settings
from modules.model_router import ModelRouter
from modules.model_router.google_client import gemini_text, parse_json_safe
from modules.prompt_engineer import build_animation_prompt

log = logging.getLogger(__name__)


_FALLBACK_PLANS = [
    {"name": "Celestial Float", "duration_seconds": 6, "complexity": "Medium",
     "mood": "Spiritual, serene",
     "description": "Background pattern slowly rotates. Crescent moon drifts. "
                    "Text pulses with golden glow. Stars twinkle independently."},
    {"name": "Golden Reveal", "duration_seconds": 4, "complexity": "High",
     "mood": "Celebratory, elegant",
     "description": "Card fades in from dark. Text sweeps in from bottom with "
                    "gold particle trail. Pattern materializes from centre."},
    {"name": "Calm Parallax", "duration_seconds": 8, "complexity": "Low",
     "mood": "Peaceful, meditative",
     "description": "Three-layer parallax: background 0.3x, midground 0.6x, "
                    "foreground static. Stars twinkle at 1-2s intervals."},
]


def plan_animations(
    vision_json: dict[str, Any],
    user_description: str = "",
) -> list[dict[str, Any]]:
    if not settings.google_ai_api_key:
        return _FALLBACK_PLANS

    system = (
        "You plan animation for static celebration cards. Given VisionStruct JSON "
        "(depth layers, objects, lighting, palette) and an optional user description, "
        "propose exactly 3 plans that respect depth and lighting physics."
    )
    prompt = f"""
VisionStruct JSON:
{json.dumps(vision_json)[:4000]}

Optional user direction: {user_description or '(none)'}

Return JSON: {{"plans": [
  {{"name": str, "description": str, "duration_seconds": int,
    "complexity": "Low"|"Medium"|"High", "mood": str }}
]}}
Exactly 3 plans. Each description should reference specific elements from the JSON.
""".strip()

    try:
        raw = gemini_text(prompt, system=system, json_mode=True)
        data = parse_json_safe(raw)
        plans = data.get("plans") or []
        if len(plans) >= 3:
            return plans[:3]
    except Exception as e:
        log.warning("Gemini animation planning failed, using fallback: %s", e)
    return _FALLBACK_PLANS


def execute_animation(
    image_url: str,
    animation_plan: dict[str, Any],
    vision_json: dict[str, Any],
    model: str,
    user_description: str = "",
) -> dict[str, Any]:
    prompt = build_animation_prompt(vision_json, animation_plan["description"], user_description)
    url = ModelRouter().generate_video(model, image_url, prompt)
    return {"url": url, "prompt": prompt, "duration": animation_plan["duration_seconds"]}

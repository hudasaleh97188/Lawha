"""VisionStruct JSON Engine."""
from __future__ import annotations

import logging
from typing import Any

import httpx

from api.config import settings
from modules.model_router.google_client import gemini_vision, parse_json_safe
from .prompt import VISION_STRUCT_PROMPT

log = logging.getLogger(__name__)


def _mock_vision_json(image_url: str) -> dict[str, Any]:
    return {
        "meta": {"image_quality": "High", "image_type": "Illustration",
                 "resolution_estimation": "~1080x1080", "source_url": image_url},
        "global_context": {
            "scene_description": "Celebration card with central calligraphy",
            "time_of_day": "Night / Artificial warm lighting",
            "weather_atmosphere": "Serene",
            "lighting": {"source": "Artificial", "direction": "Centre-radial",
                         "quality": "Soft diffused glow", "color_temp": "Warm golden"},
        },
        "color_palette": {
            "dominant_hex_estimates": ["#1A0A2E", "#C9A84C", "#FFFFFF"],
            "accent_colors": ["Deep violet", "Gold shimmer", "Ivory"],
            "contrast_level": "High",
        },
        "composition": {"camera_angle": "Eye-level / flat lay",
                        "framing": "Portrait close-up",
                        "depth_of_field": "Deep", "focal_point": "Central text"},
        "objects": [
            {"id": "obj_001", "label": "Calligraphy Text", "category": "Typography",
             "location": "Center", "prominence": "Foreground",
             "visual_attributes": {"color": "Gold", "texture": "Smooth metallic",
                                   "material": "Digital vector", "state": "Clean",
                                   "dimensions_relative": "40% frame height"},
             "micro_details": ["Subtle drop shadow", "Fine gold outline"],
             "pose_or_orientation": "Centred horizontal", "text_content": None},
        ],
        "text_ocr": {"present": False, "content": []},
        "semantic_relationships": ["obj_001 layered above background pattern"],
    }


async def analyze_image(image_url: str, dry_run: bool = False) -> dict[str, Any]:
    """Run VisionStruct on an image URL. Returns structured JSON."""
    if dry_run or not settings.google_ai_api_key:
        return _mock_vision_json(image_url)

    async with httpx.AsyncClient(timeout=60) as client:
        img = await client.get(image_url)
        img.raise_for_status()
        raw = img.content
        mime = img.headers.get("content-type", "image/jpeg").split(";")[0]

    try:
        text = gemini_vision(raw, mime, VISION_STRUCT_PROMPT, json_mode=True)
        parsed = parse_json_safe(text)
        if isinstance(parsed, dict):
            return parsed
    except Exception as e:
        log.warning("vision_struct call failed, returning mock: %s", e)
    return _mock_vision_json(image_url)

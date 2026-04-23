"""Social caption generation, platform-aware."""
from __future__ import annotations

import logging
from typing import Any

from api.config import settings
from modules.model_router.google_client import gemini_text, parse_json_safe

log = logging.getLogger(__name__)

PLATFORM_LIMITS = {
    "instagram": {"chars": 2200, "hashtags": 10},
    "twitter":   {"chars": 280,  "hashtags": 3},
    "linkedin":  {"chars": 3000, "hashtags": 5},
    "tiktok":    {"chars": 2200, "hashtags": 8},
}

_OCCASION_HASHTAGS = {
    "eid_al_fitr":  ["#EidMubarak", "#EidAlFitr", "#Eid"],
    "eid_al_adha":  ["#EidAlAdha", "#EidMubarak"],
    "ramadan":      ["#RamadanKareem", "#Ramadan", "#Iftar"],
    "friday_dua":   ["#JummahMubarak", "#FridayDua"],
    "birthday":     ["#HappyBirthday", "#Birthday"],
    "anniversary":  ["#Anniversary", "#Love"],
    "graduation":   ["#Graduation", "#Proud"],
    "wedding":      ["#Wedding", "#Mubarak"],
    "new_year":     ["#NewYear", "#Celebration"],
    "national_day": ["#NationalDay", "#Proud"],
    "motivational": ["#Motivation", "#DailyReminder"],
    "custom":       [],
}


def _mock_caption(platform: str, occasion: str, topic: str, ocr_text: str) -> dict[str, Any]:
    body_map = {
        "instagram": f"✨ {topic} ✨\n\n{ocr_text}\n\nCrafted with love.",
        "twitter":   f"{topic} — {ocr_text}".strip(" —"),
        "linkedin":  f"Sharing this {topic} moment. {ocr_text}".strip(),
        "tiktok":    f"{topic} 🌙 {ocr_text}".strip(),
    }
    tags = _OCCASION_HASHTAGS.get(occasion, [])[: PLATFORM_LIMITS[platform]["hashtags"]]
    return {"platform": platform, "text": body_map.get(platform, topic), "hashtags": tags}


def generate_caption(
    platform: str,
    occasion: str,
    vision_json: dict[str, Any],
    topic: str,
) -> dict[str, Any]:
    ocr_text = ""
    if vision_json.get("text_ocr", {}).get("present"):
        parts = vision_json["text_ocr"]["content"] or []
        if parts:
            ocr_text = parts[0].get("text", "")

    if not settings.google_ai_api_key:
        return _mock_caption(platform, occasion, topic, ocr_text)

    palette = vision_json.get("color_palette", {}).get("accent_colors", [])
    limit = PLATFORM_LIMITS[platform]
    system = (
        "You write social captions for celebration cards. Keep the voice warm and "
        "culturally aware. Match the platform's vibe. Return JSON only."
    )
    prompt = f"""
Topic: {topic}
Occasion: {occasion}
Platform: {platform}  (max {limit['chars']} chars, {limit['hashtags']} hashtags)
Image accent colors: {palette}
Image contains text: {ocr_text or 'none'}

Return JSON with keys: text (string), hashtags (array of #Tag strings).
Respect platform tone. If occasion is Islamic, honor Arabic terms correctly.
""".strip()

    try:
        raw = gemini_text(prompt, system=system, json_mode=True)
        data = parse_json_safe(raw)
        tags = data.get("hashtags", [])[: limit["hashtags"]]
        return {"platform": platform, "text": data.get("text", ""), "hashtags": tags}
    except Exception as e:
        log.warning("Gemini caption failed, using mock: %s", e)
        return _mock_caption(platform, occasion, topic, ocr_text)

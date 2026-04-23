"""Agent Core: adaptive, Gemini-driven suggestion loop.

The agent decides each turn whether to ask ONE clarifying question (with 3-4
tappable options) or to finish with a list of confirmed changes. Max 3 rounds;
fewer is fine — a specific prompt may terminate immediately.
"""
from __future__ import annotations

import json
import logging
from typing import Any

from api.config import settings
from modules.model_router.google_client import gemini_text, parse_json_safe

log = logging.getLogger(__name__)

MAX_ROUNDS = 3


def _mock_step(change_prompt: str, history: list[dict[str, Any]]) -> dict[str, Any]:
    """Offline fallback: one question, then done."""
    if not history:
        return {
            "done": False,
            "question": f"You said: \u201c{change_prompt}\u201d. Which direction fits best?",
            "options": [
                {"id": "bolder",   "label": "Make it bolder",   "icon": "\u2605"},
                {"id": "softer",   "label": "Make it softer",   "icon": "\u273f"},
                {"id": "minimal",  "label": "Keep it minimal",  "icon": "\u25a1"},
                {"id": "typed",    "label": "Let me describe it", "custom": True},
            ],
        }
    return {
        "done": True,
        "confirmed_changes": [change_prompt] + [h.get("answer", "") for h in history if h.get("answer")],
        "summary": f"Apply: {change_prompt}",
    }


_SYSTEM = """\
You are a card-design assistant helping a user refine a celebration card
(Eid, Ramadan, birthday, etc.). You receive:
- the user's change prompt
- VisionStruct JSON describing the reference image
- occasion + topic
- the conversation history so far (previous Q&A rounds)

Your job each turn: decide whether you have enough specific, actionable
information to produce the final change instructions.

RULES
1. If the change prompt is already specific and unambiguous, finish
   immediately (zero questions). Example: "make the gold brighter and
   add a crescent moon top-right" is specific.
2. Otherwise ask ONE short, concrete clarifying question with 3-4
   tappable options. Always include a "Let me describe it" option with
   `custom: true` as an escape hatch.
3. Questions must be contextual: use the occasion, the image's palette,
   the OCR text, etc. Never ask generic questions.
4. Maximum 3 rounds total. If you have already asked 3, you MUST finish.
5. When you finish, produce `confirmed_changes`: an array of concrete
   instructions the image-generator can follow. Include the user's
   original intent and every answered option, rewritten as imperative
   design directives (e.g. "Use a spiritual tone in the typography",
   "Replace text with: \u062a\u0648\u0643\u0651\u0644 \u0639\u0644\u0649 \u0627\u0644\u0644\u0647").
6. If the user typed a custom answer, trust it — do not re-question it.

OUTPUT
Return ONLY a JSON object, no prose, no markdown.
Two shapes:

  ASKING:
  {
    "done": false,
    "question": "<one sentence>",
    "options": [
      { "id": "<slug>", "label": "<short label>", "icon": "<optional emoji>" },
      ...
      { "id": "custom", "label": "Let me describe it", "custom": true }
    ],
    "round_hint": "Step N of up to 3"
  }

  FINISHED:
  {
    "done": true,
    "summary": "<one-sentence plain-English summary of all changes>",
    "confirmed_changes": [ "<directive>", "<directive>", ... ]
  }
"""


def next_step(
    change_prompt: str,
    vision_json: dict[str, Any] | None,
    occasion: str,
    topic: str,
    history: list[dict[str, Any]],
) -> dict[str, Any]:
    """Advance the suggestion loop by one turn.

    `history` is a list of `{question, answer}` dicts from prior rounds.
    Returns either an ASKING or FINISHED payload (see _SYSTEM).
    """
    if len(history) >= MAX_ROUNDS:
        return {
            "done": True,
            "summary": change_prompt,
            "confirmed_changes": [change_prompt]
                + [h.get("answer", "") for h in history if h.get("answer")],
        }

    if not settings.google_ai_api_key:
        return _mock_step(change_prompt, history)

    vision_slim = _slim_vision(vision_json or {})
    prompt = json.dumps({
        "change_prompt": change_prompt,
        "occasion": occasion,
        "topic": topic,
        "vision": vision_slim,
        "history": history,
        "rounds_asked": len(history),
        "rounds_remaining": MAX_ROUNDS - len(history),
    }, ensure_ascii=False)

    try:
        raw = gemini_text(prompt, system=_SYSTEM, json_mode=True)
        data = parse_json_safe(raw)
        if isinstance(data, dict) and "done" in data:
            return data
    except Exception as e:
        log.warning("Gemini call failed, using mock: %s", e)
    return _mock_step(change_prompt, history)


def _slim_vision(v: dict[str, Any]) -> dict[str, Any]:
    """Trim the VisionStruct JSON so we don't blow the context for every turn."""
    if not v:
        return {}
    return {
        "palette": v.get("color_palette", {}).get("dominant_hex_estimates", []),
        "accents": v.get("color_palette", {}).get("accent_colors", []),
        "scene":   v.get("global_context", {}).get("scene_description", ""),
        "lighting": v.get("global_context", {}).get("lighting", {}),
        "focal":   v.get("composition", {}).get("focal_point", ""),
        "objects": [
            {"label": o.get("label"), "location": o.get("location"),
             "text": o.get("text_content")}
            for o in (v.get("objects") or [])[:8]
        ],
        "ocr": v.get("text_ocr", {}),
    }

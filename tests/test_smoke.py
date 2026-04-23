"""Smoke tests for pure functions and the FastAPI surface."""
from __future__ import annotations

from fastapi.testclient import TestClient

from api.app import create_app
from modules.agent_core.suggestions import _slim_vision
from modules.caption.generator import _mock_caption
from modules.prompt_engineer import (
    build_animation_prompt,
    build_image_prompt,
    build_improvement_prompt,
)
from modules.style_picker import OCCASIONS, STYLES, get_style_injection
from modules.sharing import build_share_payload


# ── pure helpers ─────────────────────────────────────────────────────

def test_style_injection_known():
    inj = get_style_injection("ramadan_lantern")
    assert "lantern" in inj.lower()


def test_style_injection_custom_passthrough():
    assert get_style_injection("custom", "neon vapor") == "neon vapor"


def test_styles_and_occasions_are_dicts():
    assert isinstance(STYLES, dict) and STYLES
    assert isinstance(OCCASIONS, dict) and OCCASIONS


def test_slim_vision_handles_empty():
    assert _slim_vision({}) == {}


def test_slim_vision_extracts_keys():
    out = _slim_vision({
        "color_palette": {"dominant_hex_estimates": ["#fff"], "accent_colors": ["gold"]},
        "global_context": {"scene_description": "scene", "lighting": {"direction": "top"}},
        "composition": {"focal_point": "center"},
        "objects": [{"label": "moon", "location": "top", "text_content": None}],
        "text_ocr": {"present": False, "content": []},
    })
    assert out["palette"] == ["#fff"]
    assert out["accents"] == ["gold"]
    assert out["focal"] == "center"
    assert out["objects"][0]["label"] == "moon"


def test_mock_caption_respects_hashtag_limit():
    cap = _mock_caption("twitter", "ramadan", "Ramadan", "Kareem")
    assert cap["platform"] == "twitter"
    assert len(cap["hashtags"]) <= 3


def test_build_image_prompt_includes_style():
    prompt = build_image_prompt(
        {"color_palette": {"dominant_hex_estimates": ["#000"]},
         "composition": {"framing": "portrait", "focal_point": "center"},
         "global_context": {"lighting": {"direction": "top", "quality": "soft"}},
         "objects": [{"label": "moon", "location": "top",
                      "visual_attributes": {"color": "gold", "texture": "smooth"}}]},
        style_injection="islamic geometric",
        user_changes=["add stars"],
        target_model="imagen-3.0-generate-001",
    )
    assert "islamic geometric" in prompt
    assert "add stars" in prompt


def test_build_animation_prompt_with_lighting():
    prompt = build_animation_prompt(
        {"global_context": {"lighting": {"direction": "top"}},
         "semantic_relationships": ["moon above text"]},
        animation_style="float",
        user_description="slow",
    )
    assert "float" in prompt and "slow" in prompt


def test_build_improvement_prompt_appends_note():
    out = build_improvement_prompt({}, "brighten gold", "previous prompt")
    assert "previous prompt" in out and "brighten gold" in out


def test_share_payload_combines_text_and_tags():
    out = build_share_payload("instagram", "https://x/y.png",
                              {"text": "hi", "hashtags": ["#a", "#b"]})
    assert out["url"] == "https://x/y.png"
    assert "#a" in out["text"] and "hi" in out["text"]


# ── HTTP surface ─────────────────────────────────────────────────────

def _client():
    return TestClient(create_app())


def test_health():
    r = _client().get("/api/health")
    assert r.status_code == 200 and r.json() == {"ok": True}


def test_styles_endpoint():
    r = _client().get("/api/styles")
    assert r.status_code == 200
    body = r.json()
    assert "styles" in body and "occasions" in body


def test_session_lifecycle():
    c = _client()
    sid = c.post("/api/session", json={"data": {"foo": "bar"}}).json()["id"]
    got = c.get(f"/api/session/{sid}").json()
    assert got["foo"] == "bar"
    patched = c.patch(f"/api/session/{sid}", json={"patch": {"baz": 1}}).json()
    assert patched["baz"] == 1


def test_session_404():
    r = _client().get("/api/session/does-not-exist")
    assert r.status_code == 404


def test_prompt_build_endpoint():
    r = _client().post("/api/prompt/build", json={
        "vision_json": {"color_palette": {"dominant_hex_estimates": ["#000"]},
                        "composition": {}, "global_context": {}, "objects": []},
        "style_id": "minimalist_gold",
        "custom_style_text": "",
        "user_changes": [],
        "target_model": "imagen-3.0-generate-001",
    })
    assert r.status_code == 200 and "prompt" in r.json()

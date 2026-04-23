"""Functional tests: each Gemini-driven module's success AND failure path,
exercised by monkeypatching the gemini_* boundary functions."""
from __future__ import annotations

import json

import pytest

from api.config import settings


# ── agent_core ──────────────────────────────────────────────────────

def test_next_step_uses_gemini_when_available(monkeypatch):
    from modules.agent_core import suggestions

    monkeypatch.setattr(settings, "google_ai_api_key", "fake")
    monkeypatch.setattr(
        suggestions, "gemini_text",
        lambda prompt, system=None, json_mode=False:
            '{"done": true, "summary": "ok", "confirmed_changes": ["use gold accents"]}',
    )
    out = suggestions.next_step("brighten gold", {}, "ramadan", "ramadan", history=[])
    assert out["done"] is True
    assert out["confirmed_changes"] == ["use gold accents"]


def test_next_step_falls_back_when_gemini_raises(monkeypatch):
    from modules.agent_core import suggestions

    monkeypatch.setattr(settings, "google_ai_api_key", "fake")
    def boom(*a, **kw):
        raise RuntimeError("Cannot send a request, as the client has been closed.")
    monkeypatch.setattr(suggestions, "gemini_text", boom)

    out = suggestions.next_step("brighten gold", {}, "ramadan", "ramadan", history=[])
    # Mock fallback returns the asking shape on first round.
    assert "done" in out
    assert out["done"] is False
    assert isinstance(out["options"], list) and len(out["options"]) >= 1


def test_next_step_skips_gemini_without_key(monkeypatch):
    from modules.agent_core import suggestions

    monkeypatch.setattr(settings, "google_ai_api_key", "")
    called = []
    monkeypatch.setattr(suggestions, "gemini_text",
                        lambda *a, **kw: called.append(1) or "{}")

    suggestions.next_step("x", {}, "ramadan", "x", history=[])
    assert called == [], "gemini_text must not be invoked when key is empty"


# ── caption ─────────────────────────────────────────────────────────

def test_generate_caption_real_path(monkeypatch):
    from modules.caption import generator

    monkeypatch.setattr(settings, "google_ai_api_key", "fake")
    monkeypatch.setattr(
        generator, "gemini_text",
        lambda prompt, system=None, json_mode=False:
            '{"text": "Eid Mubarak", "hashtags": ["#Eid", "#Mubarak", "#Family"]}',
    )
    out = generator.generate_caption(
        "twitter", "eid_al_fitr", {"text_ocr": {"present": False, "content": []}}, "Eid",
    )
    assert out["platform"] == "twitter"
    assert out["text"] == "Eid Mubarak"
    assert out["hashtags"] == ["#Eid", "#Mubarak", "#Family"][: 3]


def test_generate_caption_falls_back_on_failure(monkeypatch):
    from modules.caption import generator
    monkeypatch.setattr(settings, "google_ai_api_key", "fake")
    monkeypatch.setattr(generator, "gemini_text",
                        lambda *a, **kw: (_ for _ in ()).throw(RuntimeError("boom")))

    out = generator.generate_caption(
        "twitter", "ramadan", {"text_ocr": {"present": False, "content": []}}, "Ramadan",
    )
    assert out["platform"] == "twitter"
    assert isinstance(out["hashtags"], list)


# ── animation planner ──────────────────────────────────────────────

def test_plan_animations_real_path(monkeypatch):
    from modules.animation import planner

    monkeypatch.setattr(settings, "google_ai_api_key", "fake")
    plans_payload = {"plans": [
        {"name": f"P{i}", "description": "d", "duration_seconds": 4,
         "complexity": "Low", "mood": "calm"} for i in range(3)
    ]}
    monkeypatch.setattr(
        planner, "gemini_text",
        lambda prompt, system=None, json_mode=False: json.dumps(plans_payload),
    )
    plans = planner.plan_animations({"objects": []})
    assert len(plans) == 3
    assert plans[0]["name"] == "P0"


def test_plan_animations_fallback_when_short(monkeypatch):
    from modules.animation import planner
    monkeypatch.setattr(settings, "google_ai_api_key", "fake")
    monkeypatch.setattr(planner, "gemini_text",
                        lambda *a, **kw: '{"plans": [{"name":"only one"}]}')
    plans = planner.plan_animations({"objects": []})
    # Falls back to canned list when fewer than 3 are returned.
    assert len(plans) == 3
    assert all("name" in p for p in plans)


# ── vision_struct ──────────────────────────────────────────────────

def test_analyze_image_real_path(monkeypatch):
    import asyncio

    from modules.vision_struct import analyzer

    monkeypatch.setattr(settings, "google_ai_api_key", "fake")
    monkeypatch.setattr(
        analyzer, "gemini_vision",
        lambda raw, mime, prompt, json_mode=True:
            '{"meta": {"image_quality": "ok"}, "objects": []}',
    )

    class _FakeResp:
        content = b"fakebytes"
        headers = {"content-type": "image/png"}
        def raise_for_status(self): pass

    class _FakeAsyncClient:
        def __init__(self, *a, **kw): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *exc): return False
        async def get(self, url): return _FakeResp()

    monkeypatch.setattr(analyzer.httpx, "AsyncClient", _FakeAsyncClient)

    out = asyncio.run(analyzer.analyze_image("https://example.com/x.png"))
    assert out["meta"]["image_quality"] == "ok"


def test_analyze_image_falls_back_on_gemini_error(monkeypatch):
    import asyncio

    from modules.vision_struct import analyzer

    monkeypatch.setattr(settings, "google_ai_api_key", "fake")
    monkeypatch.setattr(analyzer, "gemini_vision",
                        lambda *a, **kw: (_ for _ in ()).throw(RuntimeError("boom")))

    class _FakeResp:
        content = b""
        headers = {"content-type": "image/png"}
        def raise_for_status(self): pass

    class _FakeAsyncClient:
        def __init__(self, *a, **kw): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *exc): return False
        async def get(self, url): return _FakeResp()

    monkeypatch.setattr(analyzer.httpx, "AsyncClient", _FakeAsyncClient)

    out = asyncio.run(analyzer.analyze_image("https://example.com/x.png"))
    # Mock fallback returns the canned shape with `meta.source_url`.
    assert out["meta"]["source_url"] == "https://example.com/x.png"


# ── image generation ──────────────────────────────────────────────

def test_generate_variants_uses_router(monkeypatch):
    from modules.image_gen import generator
    from modules.model_router import router as router_mod

    monkeypatch.setattr(
        router_mod.ModelRouter, "generate_image",
        lambda self, model, prompt, n=1: [f"https://x/{i}.png" for i in range(n)],
    )
    out = generator.generate_variants(
        {"objects": []}, "gold accent", ["brighten"], "imagen-3.0-generate-001", n=3,
    )
    assert len(out) == 3
    assert out[0]["url"].startswith("https://x/")
    assert out[0]["model"] == "imagen-3.0-generate-001"

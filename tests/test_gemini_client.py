"""Verifies the cached genai.Client singleton behaviour."""
from __future__ import annotations

import pytest

from api.config import settings
from modules.model_router import google_client


class _FakeClient:
    def __init__(self, **kwargs):
        self.kwargs = kwargs


@pytest.fixture(autouse=True)
def _reset():
    google_client.reset_client()
    yield
    google_client.reset_client()


def test_client_is_cached(monkeypatch):
    monkeypatch.setattr(settings, "google_ai_api_key", "fake")
    fake_module = type("M", (), {"Client": _FakeClient})
    monkeypatch.setitem(__import__("sys").modules, "google", type("G", (), {"genai": fake_module}))
    monkeypatch.setattr("google.genai", fake_module, raising=False)

    a = google_client._client()
    b = google_client._client()
    assert a is b, "client should be cached across calls"


def test_reset_client_clears_cache(monkeypatch):
    monkeypatch.setattr(settings, "google_ai_api_key", "fake")
    fake_module = type("M", (), {"Client": _FakeClient})
    monkeypatch.setattr("google.genai", fake_module, raising=False)

    a = google_client._client()
    google_client.reset_client()
    b = google_client._client()
    assert a is not b, "reset_client should force a fresh instance"


def test_client_raises_without_key(monkeypatch):
    monkeypatch.setattr(settings, "google_ai_api_key", "")
    with pytest.raises(RuntimeError, match="GOOGLE_AI_API_KEY"):
        google_client._client()

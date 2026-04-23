"""Builds the Web Share API payload (caption + hashtags + media URL) handed off to the front-end share sheet."""
from __future__ import annotations

from typing import Any


def build_share_payload(
    platform: str,
    media_url: str,
    caption: dict[str, Any],
) -> dict[str, Any]:
    text = caption.get("text", "")
    tags = " ".join(caption.get("hashtags", []))
    return {
        "platform": platform,
        "url": media_url,
        "text": f"{text}\n\n{tags}".strip(),
    }


__all__ = ["build_share_payload"]

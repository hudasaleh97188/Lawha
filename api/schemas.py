"""Request DTOs for the HTTP layer."""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class SearchReq(BaseModel):
    topic: str
    description: str | None = None
    n: int = 12


class VisionReq(BaseModel):
    image_url: str
    dry_run: bool = False


class SuggestionReq(BaseModel):
    change_prompt: str
    vision_json: dict[str, Any] | None = None
    occasion: str = ""
    topic: str = ""
    history: list[dict[str, Any]] = []


class PromptBuildReq(BaseModel):
    vision_json: dict[str, Any]
    style_id: str
    custom_style_text: str = ""
    user_changes: list[str] = []
    target_model: str


class GenerateReq(BaseModel):
    vision_json: dict[str, Any]
    style_id: str
    custom_style_text: str = ""
    user_changes: list[str] = []
    model: str
    n: int = 3


class ImproveReq(BaseModel):
    vision_json: dict[str, Any]
    improvement_note: str
    previous_prompt: str
    model: str


class AnimPlanReq(BaseModel):
    vision_json: dict[str, Any]
    user_description: str = ""


class AnimExecReq(BaseModel):
    image_url: str
    animation_plan: dict[str, Any]
    vision_json: dict[str, Any]
    model: str
    user_description: str = ""


class CaptionReq(BaseModel):
    platform: str
    occasion: str
    vision_json: dict[str, Any]
    topic: str


class ShareReq(BaseModel):
    platform: str
    media_url: str
    caption: dict[str, Any]


class SessionReq(BaseModel):
    data: dict[str, Any] = {}


class SessionPatchReq(BaseModel):
    patch: dict[str, Any]

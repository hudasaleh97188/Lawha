from __future__ import annotations

from fastapi import APIRouter

from modules.model_router import available_models
from modules.style_picker import OCCASIONS, STYLES

router = APIRouter(prefix="/api", tags=["meta"])


@router.get("/health")
def health():
    return {"ok": True}


@router.get("/styles")
def get_styles():
    return {"styles": STYLES, "occasions": OCCASIONS}


@router.get("/models/image")
def get_image_models():
    return {"models": available_models("image")}


@router.get("/models/video")
def get_video_models():
    return {"models": available_models("video")}

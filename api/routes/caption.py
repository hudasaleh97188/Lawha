from __future__ import annotations

from fastapi import APIRouter

from api.schemas import CaptionReq
from modules.caption import generate_caption

router = APIRouter(prefix="/api", tags=["caption"])


@router.post("/caption")
def api_caption(req: CaptionReq):
    return generate_caption(req.platform, req.occasion, req.vision_json, req.topic)

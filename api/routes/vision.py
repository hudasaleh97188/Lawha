from __future__ import annotations

from fastapi import APIRouter

from api.schemas import VisionReq
from modules.vision_struct import analyze_image

router = APIRouter(prefix="/api/vision", tags=["vision"])


@router.post("/analyze")
async def api_vision(req: VisionReq):
    return await analyze_image(req.image_url, dry_run=req.dry_run)

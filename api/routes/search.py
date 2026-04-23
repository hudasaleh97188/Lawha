from __future__ import annotations

from fastapi import APIRouter

from api.schemas import SearchReq
from modules.image_search import search_images

router = APIRouter(prefix="/api", tags=["search"])


@router.post("/search")
async def api_search(req: SearchReq):
    results = await search_images(req.topic, req.description or "", req.n)
    return {"images": results}

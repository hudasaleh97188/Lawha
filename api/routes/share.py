from __future__ import annotations

from fastapi import APIRouter

from api.schemas import ShareReq
from modules.sharing import build_share_payload

router = APIRouter(prefix="/api/share", tags=["share"])


@router.post("/payload")
def api_share(req: ShareReq):
    return build_share_payload(req.platform, req.media_url, req.caption)

from __future__ import annotations

from fastapi import APIRouter

from api.schemas import SuggestionReq
from modules.agent_core import next_step

router = APIRouter(prefix="/api", tags=["suggestions"])


@router.post("/suggestions")
def api_suggestions(req: SuggestionReq):
    return next_step(
        change_prompt=req.change_prompt,
        vision_json=req.vision_json,
        occasion=req.occasion,
        topic=req.topic,
        history=req.history,
    )

from __future__ import annotations

from fastapi import APIRouter

from api.schemas import PromptBuildReq
from modules.prompt_engineer import build_image_prompt
from modules.style_picker import get_style_injection

router = APIRouter(prefix="/api/prompt", tags=["prompt"])


@router.post("/build")
def api_prompt(req: PromptBuildReq):
    inj = get_style_injection(req.style_id, req.custom_style_text)
    prompt = build_image_prompt(req.vision_json, inj, req.user_changes, req.target_model)
    return {"prompt": prompt}

from __future__ import annotations

from fastapi import APIRouter

from api.schemas import GenerateReq, ImproveReq
from modules.image_gen import generate_variants, improve_variant
from modules.style_picker import get_style_injection

router = APIRouter(prefix="/api/generate", tags=["generate"])


@router.post("/images")
def api_generate(req: GenerateReq):
    inj = get_style_injection(req.style_id, req.custom_style_text)
    variants = generate_variants(req.vision_json, inj, req.user_changes, req.model, req.n)
    return {"variants": variants}


@router.post("/improve")
def api_improve(req: ImproveReq):
    return improve_variant(req.vision_json, req.improvement_note, req.previous_prompt, req.model)

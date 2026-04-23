from __future__ import annotations

from fastapi import APIRouter

from api.schemas import AnimExecReq, AnimPlanReq
from modules.animation import execute_animation, plan_animations

router = APIRouter(prefix="/api/animation", tags=["animation"])


@router.post("/plan")
def api_anim_plan(req: AnimPlanReq):
    return {"plans": plan_animations(req.vision_json, req.user_description)}


@router.post("/execute")
def api_anim_exec(req: AnimExecReq):
    return execute_animation(
        req.image_url, req.animation_plan, req.vision_json,
        req.model, req.user_description,
    )

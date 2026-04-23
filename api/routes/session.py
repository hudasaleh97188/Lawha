from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from api.dependencies import get_session_store
from api.schemas import SessionPatchReq, SessionReq
from modules.session_store import SessionStore

router = APIRouter(prefix="/api/session", tags=["session"])


@router.post("")
def api_session_create(req: SessionReq, store: SessionStore = Depends(get_session_store)):
    sid = store.create(req.data)
    return {"id": sid}


@router.get("/{sid}")
def api_session_get(sid: str, store: SessionStore = Depends(get_session_store)):
    data = store.get(sid)
    if not data:
        raise HTTPException(404, "session not found")
    return data


@router.patch("/{sid}")
def api_session_update(
    sid: str,
    req: SessionPatchReq,
    store: SessionStore = Depends(get_session_store),
):
    data = store.update(sid, req.patch)
    if not data:
        raise HTTPException(404, "session not found")
    return data

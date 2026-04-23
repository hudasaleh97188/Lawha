"""Firestore-backed session store with in-memory fallback for dev."""
from __future__ import annotations

import logging
import uuid
from typing import Any

from api.config import settings

log = logging.getLogger(__name__)
_memory: dict[str, dict[str, Any]] = {}


class SessionStore:
    def __init__(self) -> None:
        self._fs = None
        if settings.firebase_project_id:
            try:
                from google.cloud import firestore
                self._fs = firestore.Client(project=settings.firebase_project_id)
            except Exception:
                log.exception("Firestore init failed, falling back to in-memory store")
                self._fs = None

    def create(self, data: dict[str, Any]) -> str:
        sid = uuid.uuid4().hex
        data = {**data, "id": sid}
        if self._fs:
            self._fs.collection("sessions").document(sid).set(data)
        else:
            _memory[sid] = data
        return sid

    def get(self, sid: str) -> dict[str, Any] | None:
        if self._fs:
            doc = self._fs.collection("sessions").document(sid).get()
            return doc.to_dict() if doc.exists else None
        return _memory.get(sid)

    def update(self, sid: str, patch: dict[str, Any]) -> dict[str, Any] | None:
        if self._fs:
            ref = self._fs.collection("sessions").document(sid)
            ref.set(patch, merge=True)
            return ref.get().to_dict()
        if sid not in _memory:
            return None
        _memory[sid].update(patch)
        return _memory[sid]

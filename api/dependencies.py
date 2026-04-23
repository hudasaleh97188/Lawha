"""FastAPI dependency providers."""
from __future__ import annotations

from functools import lru_cache

from modules.session_store import SessionStore


@lru_cache(maxsize=1)
def get_session_store() -> SessionStore:
    """Lazily construct one SessionStore per process. Avoids touching
    Firestore at import time, which makes tests and cold reloads cheap."""
    return SessionStore()

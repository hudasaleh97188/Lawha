"""Session persistence: Firestore-backed with an in-memory fallback when Firebase credentials are unset."""
from .store import SessionStore

__all__ = ["SessionStore"]

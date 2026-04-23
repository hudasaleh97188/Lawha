"""Filesystem anchors. Resolved relative to the package root, not the CWD,
so the API works regardless of where uvicorn was launched from."""
from __future__ import annotations

from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
GENERATED_DIR = PROJECT_ROOT / "generated"
GENERATED_DIR.mkdir(parents=True, exist_ok=True)

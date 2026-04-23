"""Centralised logging setup. Idempotent — safe to call multiple times."""
from __future__ import annotations

import logging
import os

_FMT = "%(asctime)s %(levelname)-7s %(name)s — %(message)s"
_DATEFMT = "%H:%M:%S"

_configured = False


def setup_logging(level: str | None = None) -> None:
    global _configured
    if _configured:
        return
    lvl = (level or os.getenv("LOG_LEVEL", "INFO")).upper()
    logging.basicConfig(level=lvl, format=_FMT, datefmt=_DATEFMT)
    # Mute chatty third-party libraries.
    for name in ("httpx", "httpcore", "google_genai", "google.genai", "urllib3"):
        logging.getLogger(name).setLevel(logging.WARNING)
    _configured = True

"""Catalog of visual styles and per-occasion smart defaults (palette, tone, prompt injections)."""
from .catalog import STYLES, OCCASIONS, get_style_injection, get_occasion_defaults

__all__ = ["STYLES", "OCCASIONS", "get_style_injection", "get_occasion_defaults"]

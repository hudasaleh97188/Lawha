"""Image generation: produces 3 initial variants and supports targeted improvements (Imagen via Gemini, with mock fallback)."""
from .generator import generate_variants, improve_variant

__all__ = ["generate_variants", "improve_variant"]

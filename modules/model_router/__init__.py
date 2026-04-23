"""Unified registry of image/video models across providers; hides any model whose API key is missing."""
from .router import ModelRouter, MODEL_REGISTRY, available_models

__all__ = ["ModelRouter", "MODEL_REGISTRY", "available_models"]

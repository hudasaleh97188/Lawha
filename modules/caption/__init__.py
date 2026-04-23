"""Platform-aware caption + hashtag generation (Instagram / X / LinkedIn / TikTok), informed by VisionStruct OCR."""
from .generator import generate_caption

__all__ = ["generate_caption"]

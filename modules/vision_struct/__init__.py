"""VisionStruct JSON engine: decomposes a reference image into structured palette/composition/depth/OCR JSON via Gemini."""
from .analyzer import analyze_image
from .prompt import VISION_STRUCT_PROMPT

__all__ = ["analyze_image", "VISION_STRUCT_PROMPT"]

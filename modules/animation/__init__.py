"""Animation planner and executor: turns a VisionStruct depth map into 3 motion plans, then renders the chosen one."""
from .planner import plan_animations, execute_animation

__all__ = ["plan_animations", "execute_animation"]

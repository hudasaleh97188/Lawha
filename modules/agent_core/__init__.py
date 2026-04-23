"""Interactive refinement loop: classifies user intent and proposes the next round of suggestion cards (max 3 rounds)."""
from .suggestions import next_step, MAX_ROUNDS

__all__ = ["next_step", "MAX_ROUNDS"]

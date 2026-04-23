"""HTTP route modules. Each file owns one logical domain."""
from . import (
    animation,
    caption,
    generate,
    meta,
    prompt,
    search,
    session,
    share,
    suggestions,
    vision,
)

ROUTERS = [
    meta.router,
    search.router,
    vision.router,
    suggestions.router,
    prompt.router,
    generate.router,
    animation.router,
    caption.router,
    share.router,
    session.router,
]

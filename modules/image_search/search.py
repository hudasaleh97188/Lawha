"""Image discovery: Apify (Pinterest scraper) primary, Pexels fallback, mock last."""
from __future__ import annotations

import logging
from typing import Any

import httpx

from api.config import settings

log = logging.getLogger(__name__)


async def _apify_search(query: str, n: int) -> list[dict[str, Any]]:
    if not settings.apify_api_token:
        return []
    url = "https://api.apify.com/v2/acts/epctex~pinterest-scraper/run-sync-get-dataset-items"
    async with httpx.AsyncClient(timeout=60) as c:
        r = await c.post(url, params={"token": settings.apify_api_token},
                         json={"searchQueries": [query], "maxItems": n})
        r.raise_for_status()
        items = r.json()
    return [{"url": it.get("image") or it.get("imageUrl"), "source": "pinterest"}
            for it in items if it.get("image") or it.get("imageUrl")][:n]


async def _pexels_search(query: str, n: int) -> list[dict[str, Any]]:
    if not settings.pexels_api_key:
        return []
    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.get("https://api.pexels.com/v1/search",
                        params={"query": query, "per_page": n},
                        headers={"Authorization": settings.pexels_api_key})
        r.raise_for_status()
        data = r.json()
    return [{"url": p["src"]["large"], "source": "pexels"}
            for p in data.get("photos", [])][:n]


def _mock_results(query: str, n: int) -> list[dict[str, Any]]:
    return [{"url": f"https://picsum.photos/seed/{query}-{i}/800/800",
             "source": "mock"} for i in range(n)]


async def search_images(query: str, description: str = "", n: int = 12) -> list[dict[str, Any]]:
    q = f"{query} {description}".strip()
    try:
        results = await _apify_search(q, n)
    except httpx.HTTPStatusError as e:
        log.warning("apify returned %s, falling back", e.response.status_code)
        results = []
    except Exception as e:
        log.warning("apify search failed: %s", e)
        results = []
    if not results:
        try:
            results = await _pexels_search(q, n)
        except httpx.HTTPStatusError as e:
            log.warning("pexels returned %s, falling back to mock", e.response.status_code)
            results = []
        except Exception as e:
            log.warning("pexels search failed: %s", e)
            results = []
    if not results:
        results = _mock_results(q, n)
    return results

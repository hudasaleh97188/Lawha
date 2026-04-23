# Lawha — AI Creative Pipeline for Celebration Cards

**لوحة** *(lawḥa — "a tablet, a canvas")*

Lawha turns a topic like *"Eid Mubarak"* or *"my sister's birthday"* into a finished, animated, share-ready social card. Pick references, refine through a conversational AI loop, generate three variants, animate the winner, and publish with an AI-crafted caption — all in one guided flow.

The core idea is the **VisionStruct JSON engine**: every reference image is decomposed by Gemini into a rigorous structured JSON (palette, composition, lighting, depth layers, OCR, object relationships) which becomes the source of truth for every downstream prompt — generation, animation planning, and captions.

Arabic / RTL is first-class throughout.

---

## Quickstart (5 minutes)

Prereqs: **Python 3.11+**, **Node 18+**, a **`GOOGLE_AI_API_KEY`** from [Google AI Studio](https://aistudio.google.com/apikey) (free tier is enough). Everything else has a mock fallback.

```bash
# 1. Backend
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt
cp .env.example .env                                  # add GOOGLE_AI_API_KEY=...
.venv/Scripts/python.exe -m uvicorn api.main:app --reload   # :8000

# 2. Frontend (new terminal)
cd ui
npm install
npm run dev                                           # :5173
```

Open <http://localhost:5173>. The Vite dev server proxies `/api/*` and `/generated/*` to the FastAPI backend, so you only need the two terminals.

- API docs: <http://localhost:8000/docs>
- Health: <http://localhost:8000/api/health>

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Vite + React UI  (ui/)        proxies /api, /generated      │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTP :8000
┌───────────────────────────▼──────────────────────────────────┐
│  FastAPI app  (api/main.py → api/app.py factory)             │
│    ├─ api/routes/*.py        one router per domain           │
│    ├─ api/schemas.py         pydantic request/response       │
│    ├─ api/dependencies.py    DI (settings, model router…)    │
│    ├─ api/paths.py           filesystem layout (generated/)  │
│    └─ api/logging_config.py  LOG_LEVEL env var               │
│                                                              │
│  modules/                                                    │
│    image_search   → Apify (Pinterest) → Pexels → mock        │
│    style_picker   → catalog + occasion smart defaults        │
│    agent_core     → 3-round suggestion loop                  │
│    vision_struct  → Gemini → structured JSON (★)             │
│    prompt_engineer→ enriched prompt builder                  │
│    model_router   → unified Google/OpenAI/local registry     │
│    image_gen      → 3 variants + improvement                 │
│    animation      → planner + executor                       │
│    caption        → platform-aware caption + hashtags        │
│    sharing        → Web Share API payload                    │
│    session_store  → Firestore w/ in-memory fallback          │
│                                                              │
│  modules/model_router/google_client.py                       │
│    cached singleton genai client → AI Studio backend         │
└──────────────────────────────────────────────────────────────┘
```

**UI ↔ API wiring** (real today): Discover → `POST /api/search`, Style → `POST /api/vision/analyze`, Suggest → `POST /api/suggestions` (LLM loop), Variants → `POST /api/generate/images` (Imagen). AnimateScreen and ShareScreen still use mock data pending real video-model integration.

---

## Project Structure

```
Lawha/
├── api/
│   ├── main.py              10-line entrypoint
│   ├── app.py               create_app() factory (CORS, static, routers)
│   ├── schemas.py           pydantic models
│   ├── dependencies.py      FastAPI Depends() providers
│   ├── paths.py             GENERATED_DIR etc.
│   ├── logging_config.py    setup_logging() — honors LOG_LEVEL
│   ├── config.py            pydantic-settings, reads .env
│   └── routes/              one file per domain (search, vision, …)
├── modules/                 domain logic — see diagram above
├── tests/                   pytest, 28 tests, monkeypatched gemini
├── ui/
│   ├── src/                 React + TypeScript
│   ├── tests/specs/         Playwright e2e (discover, happy-path)
│   ├── vite.config.ts       proxy config
│   └── playwright.config.ts
├── generated/               runtime output (gitignored)
├── requirements.txt
├── .env.example
└── README.md
```

---

## Environment

All keys live in `.env`. Only `GOOGLE_AI_API_KEY` is needed for the real pipeline; everything else is optional and falls back to mocks.

| Variable | Used by | Required for |
|---|---|---|
| `GOOGLE_AI_API_KEY` | VisionStruct, agent, captions, Imagen | Real Gemini + Imagen calls (AI Studio backend) |
| `LOG_LEVEL` | `api/logging_config.py` | Defaults to `INFO`; set `DEBUG` for verbose |
| `APP_CORS_ORIGINS` | FastAPI CORS | Comma-separated allowlist (default: `http://localhost:5173`) |
| `APIFY_API_TOKEN` | image_search | Real Pinterest results (paid actor tier) |
| `SERPAPI_KEY` / `PEXELS_API_KEY` | image_search fallbacks | Free-tier image search |
| `REPLICATE_API_TOKEN` / `OPENAI_API_KEY` | model_router | Flux / DALL-E |
| `LUMA_API_KEY` / `KLING_API_KEY` / `RUNWAY_API_KEY` | model_router | Video model execution |
| `FIREBASE_PROJECT_ID` / `FIREBASE_STORAGE_BUCKET` / `FIREBASE_CREDENTIALS_JSON` | session_store | Persistence across restarts |
| `OLLAMA_BASE_URL` / `SD_BASE_URL` | model_router | Offline / local models |

---

## Common Commands

```bash
# Backend
.venv/Scripts/python.exe -m uvicorn api.main:app --reload
python -m pytest tests/ -q                # 28 tests; smoke + functional paths

# Frontend
cd ui
npm run dev                               # vite dev server
npm run build                             # production bundle to ui/dist/
npm run preview                           # serve the build
npx playwright test                       # headless e2e
npx playwright test --headed              # with browser UI (or HEADED=1)
```

---

## API Reference

All endpoints live under `/api`. Full request/response schemas at `/docs`.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/health` | Liveness check |
| `GET` | `/api/styles` | Styles + occasion defaults |
| `GET` | `/api/models/image` | Available image models |
| `GET` | `/api/models/video` | Available video models |
| `POST` | `/api/search` | Reference image search (Apify → Pexels → mock) |
| `POST` | `/api/vision/analyze` | Run VisionStruct on an image URL |
| `POST` | `/api/suggestions` | Next round in the interactive loop |
| `POST` | `/api/prompt/build` | Build enriched prompt from VisionStruct |
| `POST` | `/api/generate/images` | Generate 3 variants (Imagen) |
| `POST` | `/api/generate/improve` | Targeted improvement of one variant |
| `POST` | `/api/animation/plan` | 3 animation plans from VisionStruct |
| `POST` | `/api/animation/execute` | Render selected animation |
| `POST` | `/api/caption` | Platform caption + hashtags |
| `POST` | `/api/share/payload` | Web Share payload |
| `POST` | `/api/session` | Create session |
| `GET` | `/api/session/{id}` | Read session |
| `PATCH` | `/api/session/{id}` | Merge-patch session |

---

## The VisionStruct Engine

Before any generation, a reference image is sent to Gemini 2.5 Flash with the VisionStruct system prompt and transcoded into:

```json
{
  "meta":              { "image_quality", "image_type", "resolution_estimation" },
  "global_context":    { "scene_description", "time_of_day", "lighting" },
  "color_palette":     { "dominant_hex_estimates", "accent_colors", "contrast_level" },
  "composition":       { "camera_angle", "framing", "depth_of_field", "focal_point" },
  "objects":           [ { "id", "label", "location", "prominence", "visual_attributes", "micro_details", "text_content" } ],
  "text_ocr":          { "present", "content" },
  "semantic_relationships": [ "obj_001 layered above obj_002", "…" ]
}
```

This JSON feeds:
- **Generation** — exact palette, composition, focal point, object placement
- **Animation planning** — depth layers drive parallax; lighting direction drives shadow motion
- **Captioning** — OCR text + occasion informs tone, hashtags, language

The full system prompt lives in `modules/vision_struct/prompt.py`. Results are cached per-image in the session document.

---

## Troubleshooting

**Gemini "client closed" errors.** The Gemini client is a cached singleton in `modules/model_router/google_client.py`. If you ever see a closed-client error, restart the uvicorn process — don't recreate the client per-request.

**AI Studio vs. Vertex AI.** This project targets the **AI Studio** backend (`google-genai` with `GOOGLE_AI_API_KEY`), *not* Vertex AI. If you set `GOOGLE_APPLICATION_CREDENTIALS` or otherwise force Vertex routing, calls will 401 — Imagen on AI Studio uses the API key directly.

**Apify returns 403.** The Pinterest scraper actor requires a **paid Apify tier**. On the free tier the call fails and the search module falls back to Pexels (or mock data if no Pexels key is set).

**Playwright tests can't reach the API.** Make sure both the FastAPI backend (`:8000`) and Vite dev server (`:5173`) are running before invoking `npx playwright test`.

**Port already in use.** `uvicorn api.main:app --reload --port 8001` (then update `ui/vite.config.ts` proxy target).

---

## Testing Strategy

Cost-ordered:

- **Tier 0 — free**: registry, style mapping, prompt format routing, intent classifier, suggestion rounds, RTL rendering. Covered by `tests/` (28 tests, all gemini boundaries monkeypatched).
- **Tier 1 — <$0.02**: single VisionStruct call, caption stub, animation plan.
- **Tier 2 — <$0.15**: real image search, batch VisionStruct (caching), 1 Imagen image, improvement prompt.
- **Tier 3 — pre-release only**: full 3-variant + improvement, real video render, end-to-end pipeline.

Every module supports a mock fallback so the whole app boots with zero API keys.

---

## License

Licensed under the [Apache License, Version 2.0](./LICENSE). You may use, modify, and distribute this project under the terms of that license.

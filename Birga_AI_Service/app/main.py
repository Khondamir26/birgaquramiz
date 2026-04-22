from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

import jwt
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware

from .cache import cache_key, get as cache_get, set as cache_set
from .chat import run_chat
from .config import settings
from .database import close_pool, init_quota_table
from .models import AiStructuredResponse, ChatRequest
from .quota import (
    DAILY_GUEST_LIMIT,
    apply_soft_ban,
    check_and_increment,
    check_soft_ban,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger("ai.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_quota_table()
    logger.info("AI service ready")
    yield
    await close_pool()


app = FastAPI(title="Birga AI Service", lifespan=lifespan)

origins = [o.strip() for o in settings.cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)


def _extract_user_id(request: Request) -> str | None:
    token: str | None = None

    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]

    if not token:
        token = request.cookies.get("access_token")

    if not token:
        return None

    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        return str(payload.get("sub") or payload.get("id") or "")
    except Exception:
        return None


def _get_tracking_key(request: Request) -> tuple[str, bool]:
    user_id = _extract_user_id(request)
    if user_id:
        return f"user:{user_id}", True

    forwarded = request.headers.get("x-forwarded-for", "")
    ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")
    return f"ip:{ip}", False


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/ai/chat", response_model=AiStructuredResponse)
async def chat(body: ChatRequest, request: Request):
    if not settings.gemini_api_key:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="AI service not configured")

    tracking_key, is_auth = _get_tracking_key(request)
    session = body.sessionId or "unknown"
    logger.info(f"session={session} key={tracking_key} msgs={len(body.messages)} locale={body.locale}")

    if check_soft_ban(tracking_key):
        raise HTTPException(status_code=429, detail="Too many requests. Please slow down.")

    allowed, remaining = await check_and_increment(tracking_key, is_auth)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail="Daily AI request limit reached. Please try again tomorrow.",
        )

    # Progressive slow-down for guests nearing daily limit
    if not is_auth and remaining < DAILY_GUEST_LIMIT - 20:
        used = DAILY_GUEST_LIMIT - remaining
        delay = min(0.3 + (used - 20) * 0.05, 0.8)
        await asyncio.sleep(delay)

    key = cache_key(body.messages, body.locale or "ru")
    cached = cache_get(key)
    if cached:
        logger.info(f"cache_hit key={tracking_key}")
        return cached.model_copy(update={"remaining": remaining})

    try:
        result = await run_chat(
            messages=body.messages,
            locale=body.locale or "ru",
            project_context=body.projectContext,
            tracking_key=tracking_key,
            is_auth=is_auth,
        )
    except Exception as e:
        logger.error(f"chat_error | key={tracking_key} err={e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    # Detect abuse: if run_chat logged >= 2 abuse signals, soft-ban
    # (abuse detection happens inside run_chat; here we check a simple heuristic)
    last_len = len(body.messages[-1].content)
    if last_len > 1500 and len(body.messages) >= 4:
        last = body.messages[-1].content.lower().strip()
        repeats = sum(1 for m in body.messages[-4:] if m.content.lower().strip() == last)
        if repeats >= 3:
            apply_soft_ban(tracking_key)

    if result.products or result.materials:
        pass  # don't cache product/material results — they change
    elif result.message:
        cache_set(key, result)

    return result.model_copy(update={"remaining": remaining})

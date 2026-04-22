from __future__ import annotations

import asyncio
import json
import logging
import time
from typing import Any

from google import genai
from google.genai import types

from .config import settings
from .models import (
    AiAction, AiMaterial, AiProduct, AiStructuredResponse, ChatMessage, InputRequest,
)
from .prompt import build_system_prompt
from .tools import execute_tool

logger = logging.getLogger("ai.chat")

_client: genai.Client | None = None

FUNCTION_DECLARATIONS = [
    types.FunctionDeclaration(
        name="search_products",
        description="Search the Birga Quramiz product catalog. Use when user asks about specific products, materials, tools, or prices.",
        parameters=types.Schema(
            type=types.Type.OBJECT,
            properties={
                "query":    types.Schema(type=types.Type.STRING, description='Search query e.g. "цемент", "дрель", "плитка"'),
                "maxPrice": types.Schema(type=types.Type.NUMBER, description="Maximum price in UZS (optional)"),
                "limit":    types.Schema(type=types.Type.NUMBER, description="Number of results, default 5"),
            },
            required=["query"],
        ),
    ),
    types.FunctionDeclaration(
        name="get_categories",
        description="Get available product categories. Use when user asks what types of products are sold.",
        parameters=types.Schema(
            type=types.Type.OBJECT,
            properties={},
        ),
    ),
    types.FunctionDeclaration(
        name="calculate_materials",
        description="Calculate required construction materials based on project type and area. MUST be called whenever the user provides area (m²) and a project type.",
        parameters=types.Schema(
            type=types.Type.OBJECT,
            properties={
                "type":     types.Schema(type=types.Type.STRING, description="Project type: room, house, wall, floor, renovation"),
                "area":     types.Schema(type=types.Type.NUMBER, description="Area in square meters"),
                "material": types.Schema(type=types.Type.STRING, description="Main material: brick, block, concrete (optional)"),
            },
            required=["type", "area"],
        ),
    ),
]

TOOLS = [types.Tool(function_declarations=FUNCTION_DECLARATIONS)]


def get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


def _estimate_cost(input_chars: int, output_chars: int) -> str:
    cost = (input_chars / 4 * 0.075 + output_chars / 4 * 0.3) / 1_000_000
    return f"{cost:.6f}"


def _parse_response(raw: str, locale: str) -> AiStructuredResponse:
    fallback_suggestions = {
        "ru": ["Рассчитать материалы", "Найти товары", "Найти строителя"],
        "uz": ["Materiallarni hisoblash", "Mahsulot qidirish", "Quruvchi topish"],
        "en": ["Calculate materials", "Search products", "Find a builder"],
    }
    fallback_messages = {
        "ru": "Не удалось получить ответ. Попробуйте ещё раз.",
        "uz": "Javob olinmadi. Qaytadan urinib ko'ring.",
        "en": "Could not get a response. Please try again.",
    }
    fallback = fallback_suggestions.get(locale, fallback_suggestions["ru"])
    fallback_msg = fallback_messages.get(locale, fallback_messages["ru"])

    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.lstrip("`").lstrip("json").strip().rstrip("`").strip()

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start == -1 or end == -1:
        return AiStructuredResponse(
            message=raw.strip() or fallback_msg,
            suggestions=fallback,
        )

    try:
        parsed: dict[str, Any] = json.loads(cleaned[start : end + 1])
    except json.JSONDecodeError:
        return AiStructuredResponse(
            message=raw.strip() or fallback_msg,
            suggestions=fallback,
        )

    message = parsed.get("message", "").strip() or fallback_msg

    materials = []
    for m in parsed.get("materials", []) or []:
        if not isinstance(m, dict) or not m.get("name"):
            continue
        try:
            qty = float(str(m.get("quantity", 0)))
            safe_qty = str(round(qty)) if 1 <= qty <= 100_000 else str(m.get("quantity", ""))
        except (ValueError, TypeError):
            safe_qty = str(m.get("quantity", ""))
        materials.append(AiMaterial(
            name=str(m.get("name", ""))[:100],
            quantity=safe_qty,
            unit=str(m.get("unit", ""))[:20],
            reason=str(m.get("reason", ""))[:200],
        ))

    products = []
    for p in parsed.get("products", []) or []:
        if not isinstance(p, dict) or not p.get("name") or not p.get("slug"):
            continue
        qty = p.get("quantity")
        safe_qty = round(qty) if isinstance(qty, (int, float)) and 1 <= qty <= 10_000 else None
        stock_count = p.get("stockCount")
        products.append(AiProduct(
            id=p.get("id") if isinstance(p.get("id"), str) else None,
            slug=str(p.get("slug", "")),
            name=str(p.get("name", ""))[:200],
            price=str(p.get("price", "")),
            imageUrl=p.get("imageUrl") if isinstance(p.get("imageUrl"), str) else None,
            reason=str(p.get("reason", ""))[:300],
            quantity=safe_qty,
            inStock=p.get("inStock") if isinstance(p.get("inStock"), bool) else None,
            stockCount=stock_count if isinstance(stock_count, (int, float)) and stock_count >= 0 else None,
        ))

    actions = [
        AiAction(type=str(a.get("type", "")), label=str(a.get("label", "")))
        for a in (parsed.get("actions", []) or [])
        if isinstance(a, dict) and a.get("type") and a.get("label")
    ]

    raw_suggestions = parsed.get("suggestions", []) or []
    suggestions = [
        s if isinstance(s, str) else str(s.get("label", "") if isinstance(s, dict) else s)
        for s in raw_suggestions
    ]
    suggestions = [s for s in suggestions if s.strip()]
    if not suggestions:
        suggestions = fallback

    input_req_raw = parsed.get("inputRequest")
    input_request = None
    if isinstance(input_req_raw, dict):
        try:
            input_request = InputRequest(**input_req_raw)
        except Exception:
            pass

    return AiStructuredResponse(
        message=message,
        materials=materials,
        products=products,
        actions=actions,
        suggestions=suggestions,
        inputRequest=input_request,
    )


def _detect_abuse(messages: list[ChatMessage], key: str, tool_iterations: int) -> list[str]:
    reasons = []
    if tool_iterations >= 5:
        reasons.append("max_tool_iterations")
    if len(messages) >= 4:
        last = messages[-1].content.lower().strip()
        repeats = sum(1 for m in messages[-4:] if m.content.lower().strip() == last)
        if repeats >= 3:
            reasons.append(f"repeated_message({repeats}x)")
    if len(messages[-1].content) > 1500:
        reasons.append(f"long_message({len(messages[-1].content)})")
    return reasons


async def run_chat(
    messages: list[ChatMessage],
    locale: str,
    project_context: dict | None,
    tracking_key: str,
    is_auth: bool,
) -> AiStructuredResponse:
    client = get_client()
    start = time.time()

    history = [
        types.Content(
            role="model" if m.role == "assistant" else "user",
            parts=[types.Part.from_text(m.content)],
        )
        for m in messages[:-1]
    ]
    last_msg = messages[-1].content

    chat = client.aio.chats.create(
        model="gemini-2.5-flash",
        config=types.GenerateContentConfig(
            system_instruction=build_system_prompt(project_context),
            tools=TOOLS,
            max_output_tokens=2048,
        ),
        history=history,
    )

    async def with_timeout(coro, ms: int):
        return await asyncio.wait_for(coro, timeout=ms / 1000)

    response = await with_timeout(chat.send_message(last_msg), 12_000)

    iterations = 0
    timed_out = False

    try:
        while response.function_calls:
            iterations += 1
            if iterations > 5:
                break

            parts = []
            for fc in response.function_calls:
                tool_result = await execute_tool(
                    name=fc.name or "",
                    args=dict(fc.args or {}),
                    locale=locale,
                )
                sanitized = json.dumps(tool_result, default=str)
                parts.append(
                    types.Part.from_function_response(
                        name=fc.name or "",
                        response={"output": sanitized},
                    )
                )

            response = await with_timeout(chat.send_message(parts), 12_000)

    except asyncio.TimeoutError:
        timed_out = True
        logger.warning(f"timeout | key={tracking_key} iterations={iterations}")
    except Exception as e:
        logger.error(f"tool_loop_error | key={tracking_key} err={e}")

    raw_text = response.text or ""

    if not raw_text.strip() and iterations > 0 and not timed_out:
        try:
            retry = await with_timeout(
                chat.send_message("Provide your final response now in the required JSON format."),
                10_000,
            )
            raw_text = retry.text or ""
        except Exception:
            pass

    abuse_reasons = _detect_abuse(messages, tracking_key, iterations)
    if abuse_reasons:
        logger.warning(f"abuse | key={tracking_key} reasons={','.join(abuse_reasons)}")

    if not raw_text.strip() or "{" not in raw_text:
        logger.error(f"bad_response | key={tracking_key} locale={locale} len={len(raw_text)} raw={raw_text[:200]}")

    result = _parse_response(raw_text, locale)
    elapsed = round((time.time() - start) * 1000)
    input_chars = sum(len(m.content) for m in messages) + 3000
    cost = _estimate_cost(input_chars, len(raw_text))
    logger.info(
        f"ok | key={tracking_key} locale={locale} tools={iterations} "
        f"elapsed={elapsed}ms products={len(result.products)} ~cost=${cost}"
    )

    return result

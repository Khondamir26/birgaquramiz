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
from .product_resolver import resolve_products
from .prompt import build_system_prompt
from .tools import execute_tool

logger = logging.getLogger("ai.chat")

_client: genai.Client | None = None
CHAT_GLOBAL_TIMEOUT_MS = 35_000  # Increased from 20s to 35s for complex conversations with tools
LLM_CALL_TIMEOUT_MS = 15_000  # Increased from 10s to 15s
TOOL_TIMEOUT_MS = 8_000  # Increased from 4s to 8s for external API calls

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


def fallback_response(locale: str, message: str | None = None) -> AiStructuredResponse:
    suggestions = {
        "ru": ["Попробовать снова", "Найти товары", "Найти строителя"],
        "uz": ["Qayta urinish", "Mahsulot qidirish", "Quruvchi topish"],
        "en": ["Try again", "Search products", "Find a builder"],
    }
    messages = {
        "ru": "Что-то пошло не так. Попробуйте ещё раз.",
        "uz": "Xatolik yuz berdi. Qaytadan urinib ko'ring.",
        "en": "Something went wrong. Please try again.",
    }
    lang = locale if locale in suggestions else "ru"
    return AiStructuredResponse(
        message=message or messages[lang],
        materials=[],
        products=[],
        actions=[],
        suggestions=suggestions[lang],
    )


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

    message_raw = parsed.get("message", "")
    message = message_raw.strip() if isinstance(message_raw, str) else ""
    if not message:
        message = fallback_msg

    materials = []
    raw_materials = parsed.get("materials", [])
    if not isinstance(raw_materials, list):
        raw_materials = []
    for m in raw_materials:
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
    raw_products = parsed.get("products", [])
    if not isinstance(raw_products, list):
        raw_products = []
    for p in raw_products:
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

    raw_actions = parsed.get("actions", [])
    if not isinstance(raw_actions, list):
        raw_actions = []
    actions = [
        AiAction(type=str(a.get("type", "")), label=str(a.get("label", "")))
        for a in raw_actions
        if isinstance(a, dict) and a.get("type") and a.get("label")
    ]

    raw_suggestions = parsed.get("suggestions", []) or []
    if not isinstance(raw_suggestions, list):
        raw_suggestions = []
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


async def _execute_tool_safe(fc: Any, locale: str) -> tuple[str, dict, dict]:
    name = fc.name or ""
    args = dict(fc.args or {})
    try:
        result = await asyncio.wait_for(
            execute_tool(
                name=name,
                args=args,
                locale=locale,
            ),
            timeout=TOOL_TIMEOUT_MS / 1000,
        )
        return name, args, result
    except Exception as e:
        logger.warning(f"tool_error | name={name} err={type(e).__name__}: {e}")
        return name, args, {"error": "Tool failed"}


async def _run_chat_inner(
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
            parts=[types.Part.from_text(text=m.content)],
        )
        for m in messages[:-1]
    ]
    last_msg = messages[-1].content

    def _make_chat(hist):
        return client.aio.chats.create(
            model="gemini-2.5-flash",
            config=types.GenerateContentConfig(
                system_instruction=build_system_prompt(project_context),
                tools=TOOLS,
                max_output_tokens=2048,
            ),
            history=hist,
        )

    async def with_timeout(coro, ms: int = LLM_CALL_TIMEOUT_MS):
        return await asyncio.wait_for(coro, timeout=ms / 1000)

    chat = _make_chat(history)
    try:
        response = await with_timeout(chat.send_message(last_msg))
    except Exception as e:
        if history:
            logger.warning(f"chat_history_error | key={tracking_key} err={type(e).__name__}: {e} — retrying without history")
            chat = _make_chat([])
            response = await with_timeout(chat.send_message(last_msg))
        else:
            raise

    iterations = 0
    timed_out = False
    search_results: list[dict] = []

    try:
        while response.function_calls:
            iterations += 1
            if iterations > 5:
                break

            tool_results = await asyncio.gather(
                *[_execute_tool_safe(fc, locale) for fc in response.function_calls],
            )

            parts = []
            for name, args, tool_result in tool_results:
                if name == "search_products" and isinstance(tool_result, dict) and tool_result.get("found", 0) > 0:
                    search_results.append({
                        "query": str(args.get("query", "")),
                        "result": tool_result,
                    })
                sanitized = json.dumps(tool_result, default=str)
                parts.append(
                    types.Part.from_function_response(
                        name=name,
                        response={"output": sanitized},
                    )
                )

            response = await with_timeout(chat.send_message(parts))

    except asyncio.TimeoutError:
        timed_out = True
        logger.warning(f"timeout | key={tracking_key} iterations={iterations}")
        if iterations == 0:
            logger.warning(f"tool_timeout_no_results | key={tracking_key}")
    except Exception as e:
        logger.error(f"tool_loop_error | key={tracking_key} err={e}")

    try:
        raw_text = response.text or ""
    except Exception as e:
        logger.warning(f"response_text_error | key={tracking_key} err={type(e).__name__}: {e}")
        raw_text = ""

    if not raw_text.strip() and iterations > 0 and not timed_out:
        try:
            logger.info(f"retry_response | key={tracking_key}")
            retry = await with_timeout(
                chat.send_message("Provide your final response now in the required JSON format."),
                LLM_CALL_TIMEOUT_MS,
            )
            raw_text = retry.text or ""
        except Exception as e:
            logger.warning(f"retry_failed | key={tracking_key} err={type(e).__name__}: {e}")
            pass

    abuse_reasons = _detect_abuse(messages, tracking_key, iterations)
    if abuse_reasons:
        logger.warning(f"abuse | key={tracking_key} reasons={','.join(abuse_reasons)}")

    if not raw_text.strip() or "{" not in raw_text:
        logger.error(f"bad_response | key={tracking_key} locale={locale} len={len(raw_text)} raw={raw_text[:200]}")

    try:
        result = _parse_response(raw_text, locale)
    except Exception as e:
        logger.error(f"parse_error | key={tracking_key} err={type(e).__name__}: {e}")
        result = fallback_response(locale)

    backend_products = resolve_products(
        search_results=search_results,
        ai_products=result.products,
        materials=result.materials,
        locale=locale,
    )
    result.products = backend_products
    if backend_products:
        if not any(a.type in {"add_to_cart", "compare"} for a in result.actions):
            action_labels = {
                "ru": "Добавить в корзину",
                "uz": "Savatga qo'shish",
                "en": "Add to cart",
            }
            result.actions.append(
                AiAction(
                    type="add_to_cart",
                    label=action_labels.get(locale, action_labels["ru"]),
                )
            )
    else:
        result.actions = [
            action
            for action in result.actions
            if action.type not in {"add_to_cart", "compare"}
        ]
    elapsed = round((time.time() - start) * 1000)
    input_chars = sum(len(m.content) for m in messages) + 3000
    cost = _estimate_cost(input_chars, len(raw_text))
    logger.info(
        f"ok | key={tracking_key} locale={locale} tools={iterations} "
        f"elapsed={elapsed}ms products={len(result.products)} ~cost=${cost}"
    )

    return result


async def run_chat(
    messages: list[ChatMessage],
    locale: str,
    project_context: dict | None,
    tracking_key: str,
    is_auth: bool,
) -> AiStructuredResponse:
    try:
        return await asyncio.wait_for(
            _run_chat_inner(
                messages=messages,
                locale=locale,
                project_context=project_context,
                tracking_key=tracking_key,
                is_auth=is_auth,
            ),
            timeout=CHAT_GLOBAL_TIMEOUT_MS / 1000,
        )
    except asyncio.TimeoutError:
        logger.warning(f"global_timeout | key={tracking_key} budget={CHAT_GLOBAL_TIMEOUT_MS}ms")
        return fallback_response(locale)
    except Exception as e:
        logger.error(f"run_chat_error | key={tracking_key} err={type(e).__name__}: {e}")
        return fallback_response(locale)

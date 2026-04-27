from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from .models import AiMaterial, AiProduct

MAX_PRODUCTS = 8
MAX_PRODUCT_QUANTITY = 10_000

TOKEN_ALIASES = {
    "cement": "cement",
    "sement": "cement",
    "цемент": "cement",
    "brick": "brick",
    "gisht": "brick",
    "g'isht": "brick",
    "кирпич": "brick",
    "block": "block",
    "blok": "block",
    "блок": "block",
    "sand": "sand",
    "qum": "sand",
    "песок": "sand",
    "gravel": "gravel",
    "shagal": "gravel",
    "shag'al": "gravel",
    "щебень": "gravel",
    "paint": "paint",
    "boyoq": "paint",
    "краска": "paint",
    "tile": "tile",
    "plitka": "tile",
    "плитка": "tile",
}

PRICE_CLAIM_TOKENS = {
    "cheap",
    "cheapest",
    "price",
    "дешевый",
    "дешевле",
    "цена",
    "arzon",
    "narx",
}


@dataclass(frozen=True)
class ProductCandidate:
    raw: dict[str, Any]
    query: str
    kind: str
    rank: int

    @property
    def key(self) -> str:
        product_id = self.raw.get("id")
        if isinstance(product_id, str) and product_id:
            return product_id
        return str(self.raw.get("slug", ""))


def resolve_products(
    search_results: list[dict],
    ai_products: list[AiProduct],
    materials: list[AiMaterial],
    locale: str,
) -> list[AiProduct]:
    candidates = _collect_candidates(search_results)
    if not candidates:
        return []

    if ai_products:
        resolved = _resolve_ai_intents(ai_products, candidates, materials, locale)
        return resolved[:MAX_PRODUCTS]

    return _inject_tool_products(candidates, materials, locale)[:MAX_PRODUCTS]


def _collect_candidates(search_results: list[dict]) -> list[ProductCandidate]:
    candidates: list[ProductCandidate] = []
    seen: set[str] = set()

    for search in search_results:
        result = search.get("result")
        if not isinstance(result, dict):
            continue

        query = str(search.get("query", ""))
        raw_items = [
            ("best", result.get("best")),
            *[("alternative", item) for item in (result.get("alternatives") or [])[:2]],
        ]

        for rank, (kind, raw) in enumerate(raw_items):
            if not isinstance(raw, dict) or not raw.get("name") or not raw.get("slug"):
                continue
            candidate = ProductCandidate(raw=raw, query=query, kind=kind, rank=rank)
            if candidate.key in seen:
                continue
            seen.add(candidate.key)
            candidates.append(candidate)

    return candidates


def _resolve_ai_intents(
    ai_products: list[AiProduct],
    candidates: list[ProductCandidate],
    materials: list[AiMaterial],
    locale: str,
) -> list[AiProduct]:
    resolved: list[AiProduct] = []
    used: set[str] = set()

    for intent in ai_products:
        match = _match_intent(intent, candidates, used)
        if not match:
            continue

        used.add(match.key)
        exact = _is_exact_match(intent, match)
        quantity = _clamp_quantity(intent.quantity) or _material_quantity_for_candidate(match, materials)
        reason = _safe_reason(intent.reason, match.kind, locale, exact)
        product = _to_ai_product(match.raw, reason, quantity)
        if product:
            resolved.append(product)

    return resolved


def _inject_tool_products(
    candidates: list[ProductCandidate],
    materials: list[AiMaterial],
    locale: str,
) -> list[AiProduct]:
    products: list[AiProduct] = []

    for candidate in candidates:
        quantity = _material_quantity_for_candidate(candidate, materials)
        if candidate.kind == "alternative" and quantity:
            quantity = 1
        product = _to_ai_product(
            candidate.raw,
            _product_reason(candidate.kind, locale),
            quantity,
        )
        if product:
            products.append(product)

    return products


def _match_intent(
    intent: AiProduct,
    candidates: list[ProductCandidate],
    used: set[str],
) -> ProductCandidate | None:
    best: tuple[int, ProductCandidate] | None = None

    for candidate in candidates:
        if candidate.key in used:
            continue

        score = _match_score(intent, candidate)
        if score <= 0:
            continue
        if best is None or score > best[0] or (score == best[0] and candidate.rank < best[1].rank):
            best = (score, candidate)

    if not best or best[0] < 50:
        return None
    return best[1]


def _match_score(intent: AiProduct, candidate: ProductCandidate) -> int:
    raw = candidate.raw
    candidate_id = raw.get("id")
    candidate_slug = str(raw.get("slug", ""))
    candidate_name = str(raw.get("name", ""))

    if intent.id and isinstance(candidate_id, str) and intent.id == candidate_id:
        return 100
    if intent.slug and intent.slug == candidate_slug:
        return 95

    intent_name = _normalize_text(intent.name)
    raw_name = _normalize_text(candidate_name)
    if intent_name and raw_name and intent_name == raw_name:
        return 85
    if intent_name and raw_name and (intent_name in raw_name or raw_name in intent_name):
        return 70

    overlap = _token_overlap(intent.name, " ".join(_candidate_text_fields(candidate)))
    if overlap >= 0.6:
        return 60
    if overlap >= 0.35:
        return 50

    return 0


def _is_exact_match(intent: AiProduct, candidate: ProductCandidate) -> bool:
    raw = candidate.raw
    return (
        bool(intent.id and isinstance(raw.get("id"), str) and intent.id == raw.get("id"))
        or bool(intent.slug and intent.slug == str(raw.get("slug", "")))
    )


def _to_ai_product(raw: dict[str, Any], reason: str, quantity: int | None) -> AiProduct | None:
    if not raw.get("name") or not raw.get("slug"):
        return None

    stock_count = raw.get("stockCount")
    if not isinstance(stock_count, (int, float)) or stock_count < 0:
        stock_count = None

    return AiProduct(
        id=raw.get("id") if isinstance(raw.get("id"), str) else None,
        slug=str(raw.get("slug", "")),
        name=str(raw.get("name", ""))[:200],
        price=str(raw.get("price", "")),
        imageUrl=raw.get("imageUrl") if isinstance(raw.get("imageUrl"), str) else None,
        reason=reason,
        quantity=quantity,
        inStock=raw.get("inStock") if isinstance(raw.get("inStock"), bool) else None,
        stockCount=int(stock_count) if stock_count is not None else None,
    )


def _material_quantity_for_candidate(candidate: ProductCandidate, materials: list[AiMaterial]) -> int | None:
    candidate_tokens = _tokens(" ".join([candidate.query, *_candidate_text_fields(candidate)]))
    if not candidate_tokens:
        return None

    for material in materials:
        material_tokens = _tokens(material.name)
        if not material_tokens:
            continue
        if candidate_tokens & material_tokens:
            return _clamp_quantity(material.quantity)

    return None


def _candidate_text_fields(candidate: ProductCandidate) -> list[str]:
    raw = candidate.raw
    return [
        str(raw.get("name", "")),
        str(raw.get("category", "")),
        str(raw.get("brand", "")),
    ]


def _clamp_quantity(value: Any) -> int | None:
    if value is None:
        return None

    try:
        qty = int(round(float(str(value))))
    except (TypeError, ValueError):
        return None

    if qty < 1:
        return None
    return min(qty, MAX_PRODUCT_QUANTITY)


def _safe_reason(reason: str, kind: str, locale: str, exact_match: bool) -> str:
    cleaned = str(reason or "").strip()[:300]
    if not cleaned or not exact_match:
        return _product_reason(kind, locale)

    reason_tokens = _tokens(cleaned)
    if kind != "best" and reason_tokens & PRICE_CLAIM_TOKENS:
        return _product_reason(kind, locale)

    return cleaned


def _product_reason(kind: str, locale: str) -> str:
    if kind == "best":
        return {
            "ru": "Лучшее доступное совпадение из каталога",
            "uz": "Katalogdagi eng mos mavjud mahsulot",
            "en": "Best available catalog match",
        }.get(locale, "Лучшее доступное совпадение из каталога")
    return {
        "ru": "Альтернативный вариант из каталога",
        "uz": "Katalogdagi muqobil variant",
        "en": "Alternative catalog option",
    }.get(locale, "Альтернативный вариант из каталога")


def _token_overlap(left: str, right: str) -> float:
    left_tokens = _tokens(left)
    right_tokens = _tokens(right)
    if not left_tokens or not right_tokens:
        return 0
    return len(left_tokens & right_tokens) / len(left_tokens)


def _tokens(value: str) -> set[str]:
    raw_tokens = re.findall(r"[\w']+", _normalize_text(value), flags=re.UNICODE)
    return {
        TOKEN_ALIASES.get(token, token)
        for token in raw_tokens
        if len(token) > 1
    }


def _normalize_text(value: str) -> str:
    return str(value or "").replace("ʼ", "'").replace("‘", "'").lower().strip()

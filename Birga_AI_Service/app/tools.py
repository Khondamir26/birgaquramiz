import json
import math
from .database import get_pool

SYNONYMS: dict[str, list[str]] = {
    "sement":   ["sement", "цемент", "cement"],
    "cement":   ["cement", "цемент", "sement"],
    "цемент":   ["цемент", "cement", "sement"],
    "g'isht":   ["g'isht", "кирпич", "brick"],
    "gisht":    ["g'isht", "кирпич", "brick"],
    "кирпич":   ["кирпич", "g'isht", "brick"],
    "brick":    ["brick", "кирпич", "g'isht"],
    "qum":      ["qum", "песок", "sand"],
    "песок":    ["песок", "qum", "sand"],
    "sand":     ["sand", "песок", "qum"],
    "boyoq":    ["boyoq", "краска", "paint"],
    "краска":   ["краска", "boyoq", "paint"],
    "paint":    ["paint", "краска", "boyoq"],
    "plitka":   ["plitka", "плитка", "tile"],
    "плитка":   ["плитка", "plitka", "tile"],
    "tile":     ["tile", "плитка", "plitka"],
    "shag'al":  ["shag'al", "щебень", "gravel"],
    "щебень":   ["щебень", "shag'al", "gravel"],
    "gravel":   ["gravel", "щебень", "shag'al"],
}


def expand_query(query: str) -> list[str]:
    return SYNONYMS.get(query.lower().strip(), [query])


def _pick_best(products: list[dict]) -> dict | None:
    if not products:
        return None
    return sorted(
        products,
        key=lambda p: (not p["inStock"], p["price_raw"]),
    )[0]


async def search_products(query: str, max_price: float | None, limit: int, locale: str) -> dict:
    limit = min(limit or 5, 10)
    queries = expand_query(query)
    like_patterns = [f"%{q}%" for q in queries]

    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT p.id, p.name, p.price, p.slug, p.stock, p."imageUrl",
                   b.name AS brand_name, c.name AS category_name
            FROM   "Product" p
            LEFT JOIN "Brand"    b ON b.id = p."brandId"
            LEFT JOIN "Category" c ON c.id = p."categoryId"
            WHERE  p.status = 'APPROVED'
              AND  ($2::numeric IS NULL OR p.price <= $2)
              AND  (
                     p.name        ILIKE ANY($1)
                  OR p.description ILIKE ANY($1)
                  OR b.name        ILIKE ANY($1)
                  OR c.name        ILIKE ANY($1)
                  OR c."nameUz"    ILIKE ANY($1)
                  OR c."nameEn"    ILIKE ANY($1)
              )
            ORDER BY p."createdAt" DESC
            LIMIT $3
            """,
            like_patterns,
            max_price,
            limit,
        )

    mapped = [
        {
            "id":        str(r["id"]),
            "name":      r["name"],
            "price_raw": float(r["price"]),
            "price":     f"{int(round(float(r['price']))):,}".replace(",", " ") + " UZS",
            "imageUrl":  r["imageUrl"] or "",
            "brand":     r["brand_name"],
            "category":  r["category_name"],
            "slug":      r["slug"] or str(r["id"]),
            "inStock":   (r["stock"] or 0) > 0,
            "stockCount": r["stock"] or 0,
        }
        for r in rows
    ]

    best = _pick_best(mapped)
    alternatives = [p for p in mapped if p["id"] != (best or {}).get("id")][:3]
    return {"found": len(mapped), "best": best, "alternatives": alternatives}


async def get_categories() -> dict:
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT name, "nameUz", "nameEn", slug
            FROM   "Category"
            WHERE  "parentId" IS NULL
            ORDER BY name
            LIMIT 20
            """
        )
    return {
        "categories": [
            {"name": r["name"], "nameUz": r["nameUz"], "nameEn": r["nameEn"], "slug": r["slug"]}
            for r in rows
        ]
    }


def calculate_materials(project_type: str, area: float, wall_material: str, locale: str) -> dict:
    area = max(1.0, min(area, 2000.0))
    wall_material = wall_material or "brick"

    labels = {
        "ru": dict(cement="Цемент", bricks="Кирпич", blocks="Блоки", sand="Песок",
                   gravel="Щебень", bags="мешков", pcs="шт", tons="тонн", m3="м³"),
        "uz": dict(cement="Sement", bricks="G'isht", blocks="Bloklar", sand="Qum",
                   gravel="Shag'al", bags="qop", pcs="dona", tons="tonna", m3="m³"),
        "en": dict(cement="Cement", bricks="Bricks", blocks="Blocks", sand="Sand",
                   gravel="Gravel", bags="bags", pcs="pcs", tons="tons", m3="m³"),
    }
    l = labels.get(locale, labels["ru"])

    perimeter = math.ceil(4 * math.sqrt(area))
    wall_area = perimeter * 3  # 3m ceiling

    materials = []

    if project_type == "house":
        cement = math.ceil(area * 2.5 + wall_area * (0.25 if wall_material == "brick" else 0.15))
        bricks = math.ceil(wall_area * 110) if wall_material == "brick" else 0
        blocks = math.ceil(wall_area * 28) if wall_material == "block" else 0
        sand   = math.ceil(area * 0.35 + wall_area * 0.05)
        gravel = math.ceil(area * 0.2)
        materials = [
            {"name": l["cement"], "quantity": cement, "unit": l["bags"]},
            *([ {"name": l["bricks"], "quantity": bricks, "unit": l["pcs"]} ] if bricks else []),
            *([ {"name": l["blocks"], "quantity": blocks, "unit": l["pcs"]} ] if blocks else []),
            {"name": l["sand"],   "quantity": sand,   "unit": l["tons"]},
            {"name": l["gravel"], "quantity": gravel, "unit": l["tons"]},
        ]
    elif project_type == "wall":
        cement = math.ceil(area * 0.3)
        bricks = math.ceil(area * 110) if wall_material == "brick" else 0
        blocks = math.ceil(area * 28)  if wall_material == "block" else 0
        sand   = math.ceil(area * 0.05)
        materials = [
            {"name": l["cement"], "quantity": cement, "unit": l["bags"]},
            *([ {"name": l["bricks"], "quantity": bricks, "unit": l["pcs"]} ] if bricks else []),
            *([ {"name": l["blocks"], "quantity": blocks, "unit": l["pcs"]} ] if blocks else []),
            {"name": l["sand"], "quantity": sand, "unit": l["tons"]},
        ]
    elif project_type == "floor":
        materials = [
            {"name": l["cement"], "quantity": math.ceil(area * 0.4), "unit": l["bags"]},
            {"name": l["sand"],   "quantity": math.ceil(area * 0.06), "unit": l["tons"]},
        ]
    elif project_type == "renovation":
        materials = [
            {"name": l["cement"], "quantity": math.ceil(area * 0.9),  "unit": l["bags"]},
            {"name": l["sand"],   "quantity": math.ceil(area * 0.12), "unit": l["tons"]},
        ]
    else:  # room
        materials = [
            {"name": l["cement"], "quantity": math.ceil(area * 1.2),  "unit": l["bags"]},
            {"name": l["sand"],   "quantity": math.ceil(area * 0.15), "unit": l["tons"]},
        ]

    return {
        "projectType":  project_type,
        "area":         area,
        "wallMaterial": wall_material,
        "wallArea":     wall_area if project_type == "house" else None,
        "materials":    materials,
    }


async def execute_tool(name: str, args: dict, locale: str) -> dict:
    if name == "search_products":
        return await search_products(
            query=str(args.get("query", "")),
            max_price=args.get("maxPrice"),
            limit=int(args.get("limit", 5)),
            locale=locale,
        )
    if name == "get_categories":
        return await get_categories()
    if name == "calculate_materials":
        return calculate_materials(
            project_type=str(args.get("type", "room")),
            area=float(args.get("area", 0)),
            wall_material=str(args.get("material", "brick")),
            locale=locale,
        )
    return {"error": "Unknown tool"}

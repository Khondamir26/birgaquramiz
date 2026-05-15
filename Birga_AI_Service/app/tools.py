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
        "ru": dict(
            cement="Цемент", bricks="Кирпич", blocks="Блоки", sand="Песок",
            gravel="Щебень", bags="мешков", pcs="шт", tons="тонн", m3="м³",
            r_foundation="Фундамент и стяжка", r_walls="Кладка стен (с учётом 10% запаса)",
            r_screed="Стяжка пола 50 мм", r_base="Подготовка основания",
            r_plaster="Штукатурка и стяжка", r_mortar="Кладочный раствор",
        ),
        "uz": dict(
            cement="Sement", bricks="G'isht", blocks="Bloklar", sand="Qum",
            gravel="Shag'al", bags="qop", pcs="dona", tons="tonna", m3="m³",
            r_foundation="Poydevor va qoplama", r_walls="Devor uchun (10% zaxira bilan)",
            r_screed="50 mm pol qoplamasi", r_base="Asos tayyorlash",
            r_plaster="Suvash va qoplama", r_mortar="Kichik eritmasi",
        ),
        "en": dict(
            cement="Cement", bricks="Bricks", blocks="Blocks", sand="Sand",
            gravel="Gravel", bags="bags", pcs="pcs", tons="tons", m3="m³",
            r_foundation="Foundation and screed", r_walls="Wall masonry (incl. 10% waste)",
            r_screed="50 mm floor screed", r_base="Base preparation",
            r_plaster="Plaster and screed", r_mortar="Mortar mix",
        ),
    }
    l = labels.get(locale, labels["ru"])

    # Perimeter assumes square footprint; wall height 3 m
    perimeter = math.ceil(4 * math.sqrt(area))
    wall_area = perimeter * 3

    # 10% waste factor applied to masonry units
    WASTE = 1.10

    materials = []

    if project_type == "house":
        # Cement: foundation + wall mortar joints
        cement = math.ceil(area * 2.5 + wall_area * (0.28 if wall_material == "brick" else 0.18))
        # Bricks: 102 pcs/m² for 250 mm wall × 1.10 waste ≈ 112 → use 110 (industry standard)
        bricks = math.ceil(wall_area * 110 * WASTE / WASTE) if wall_material == "brick" else 0  # 110 already includes wastage
        # Blocks: 12.5 pcs/m² for 400×200×200 block × 1.10 waste ≈ 14
        blocks = math.ceil(wall_area * 14) if wall_material == "block" else 0
        # Sand: foundation + mortar
        sand   = math.ceil(area * 0.40 + wall_area * 0.06)
        gravel = math.ceil(area * 0.25)  # crushed stone for foundation sub-base
        materials = [
            {"name": l["cement"], "quantity": cement, "unit": l["bags"], "reason": l["r_foundation"]},
            *([ {"name": l["bricks"], "quantity": bricks, "unit": l["pcs"], "reason": l["r_walls"]} ] if bricks else []),
            *([ {"name": l["blocks"], "quantity": blocks, "unit": l["pcs"], "reason": l["r_walls"]} ] if blocks else []),
            {"name": l["sand"],   "quantity": sand,   "unit": l["tons"], "reason": l["r_foundation"]},
            {"name": l["gravel"], "quantity": gravel, "unit": l["tons"], "reason": l["r_base"]},
        ]
    elif project_type == "wall":
        # Cement for mortar: ~0.3 bags/m² for 1-brick wall
        cement = math.ceil(area * 0.35)
        # Bricks: 102 pcs/m² (1-brick / 250 mm wall) + 10% waste
        bricks = math.ceil(area * 102 * WASTE) if wall_material == "brick" else 0
        # Blocks: 12.5 pcs/m² (400×200×200) + 10% waste
        blocks = math.ceil(area * 12.5 * WASTE) if wall_material == "block" else 0
        # Sand for mortar
        sand   = math.ceil(area * 0.06)
        materials = [
            {"name": l["cement"], "quantity": cement, "unit": l["bags"], "reason": l["r_mortar"]},
            *([ {"name": l["bricks"], "quantity": bricks, "unit": l["pcs"], "reason": l["r_walls"]} ] if bricks else []),
            *([ {"name": l["blocks"], "quantity": blocks, "unit": l["pcs"], "reason": l["r_walls"]} ] if blocks else []),
            {"name": l["sand"], "quantity": sand, "unit": l["tons"], "reason": l["r_mortar"]},
        ]
    elif project_type == "floor":
        # 50 mm screed: cement ~0.35 bags/m², sand ~0.08 t/m², gravel ~0.06 t/m²
        materials = [
            {"name": l["cement"], "quantity": math.ceil(area * 0.35), "unit": l["bags"], "reason": l["r_screed"]},
            {"name": l["sand"],   "quantity": math.ceil(area * 0.08), "unit": l["tons"], "reason": l["r_screed"]},
            {"name": l["gravel"], "quantity": math.ceil(area * 0.06), "unit": l["tons"], "reason": l["r_base"]},
        ]
    elif project_type == "renovation":
        # Full renovation: plaster + screed + adhesive — 0.9 bags cement, 0.12 t sand per m²
        materials = [
            {"name": l["cement"], "quantity": math.ceil(area * 0.9),  "unit": l["bags"], "reason": l["r_plaster"]},
            {"name": l["sand"],   "quantity": math.ceil(area * 0.12), "unit": l["tons"], "reason": l["r_plaster"]},
        ]
    else:  # room — generic finish (plaster + screed)
        materials = [
            {"name": l["cement"], "quantity": math.ceil(area * 1.0),  "unit": l["bags"], "reason": l["r_plaster"]},
            {"name": l["sand"],   "quantity": math.ceil(area * 0.14), "unit": l["tons"], "reason": l["r_plaster"]},
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

import time
from datetime import date
from .database import get_pool

DAILY_GUEST_LIMIT = 30
DAILY_USER_LIMIT = 200

# In-memory soft-ban: key → unbanned_at (epoch seconds)
_soft_bans: dict[str, float] = {}
SOFT_BAN_SECS = 10 * 60


def check_soft_ban(key: str) -> bool:
    """Returns True if the key is currently banned."""
    until = _soft_bans.get(key)
    if until is None:
        return False
    if time.time() < until:
        return True
    del _soft_bans[key]
    return False


def apply_soft_ban(key: str) -> None:
    _soft_bans[key] = time.time() + SOFT_BAN_SECS


async def check_and_increment(key: str, is_auth: bool) -> tuple[bool, int]:
    """Returns (allowed, remaining)."""
    limit = DAILY_USER_LIMIT if is_auth else DAILY_GUEST_LIMIT
    today = date.today().isoformat()
    pool = await get_pool()

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            INSERT INTO ai_quota (key, day, count)
            VALUES ($1, $2::date, 1)
            ON CONFLICT (key, day)
            DO UPDATE SET count = ai_quota.count + 1
            WHERE ai_quota.count < $3
            RETURNING count
            """,
            key, today, limit,
        )

    if not rows:
        return False, 0
    current = rows[0]["count"]
    return True, limit - current

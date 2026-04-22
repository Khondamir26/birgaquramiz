import asyncpg
from .config import settings

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            settings.database_url,
            min_size=2,
            max_size=10,
            command_timeout=10,
        )
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


async def init_quota_table() -> None:
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS ai_quota (
                key   TEXT NOT NULL,
                day   DATE NOT NULL,
                count INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY (key, day)
            )
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_ai_quota_key_day ON ai_quota(key, day)
        """)

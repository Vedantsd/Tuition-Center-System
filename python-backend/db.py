import os

import oracledb
from dotenv import load_dotenv

load_dotenv(
    dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env")
)

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_DSN = os.getenv("DB_DSN")

POOL_MIN = int(os.getenv("DB_POOL_MIN", 1))
POOL_MAX = int(os.getenv("DB_POOL_MAX", 5))
POOL_INCREMENT = int(os.getenv("DB_POOL_INCREMENT", 1))

if not all([DB_USER, DB_PASSWORD, DB_DSN]):
    raise EnvironmentError(
        "Missing OracleDB credentials. Set DB_USER, DB_PASSWORD, and DB_DSN in your .env file."
    )

_pool: oracledb.ConnectionPool | None = None


def _get_pool() -> oracledb.ConnectionPool:
    global _pool

    if _pool is None:
        _pool = oracledb.create_pool(
            user=DB_USER,
            password=DB_PASSWORD,
            dsn=DB_DSN,
            min=POOL_MIN,
            max=POOL_MAX,
            increment=POOL_INCREMENT,
        )

    return _pool


def get_connection() -> oracledb.Connection:
    return _get_pool().acquire()
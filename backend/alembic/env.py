from __future__ import annotations

import os
import sys
from logging.config import fileConfig
from urllib.parse import urlparse

from alembic import context
from sqlalchemy import engine_from_config, pool

# Add backend/ to import path so app.database.models can be imported.
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.database.models import Base  # noqa: F401 — register models on metadata

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


def load_dotenv(path: str) -> None:
    if not os.path.exists(path):
        return

    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            os.environ.setdefault(key, value)


def is_pooler_url(url: str) -> bool:
    parsed = urlparse(url)
    host = parsed.hostname or ""
    return "pooler.supabase.com" in host


def get_database_url() -> str:
    base_dir = os.path.dirname(os.path.dirname(__file__))
    load_dotenv(os.path.join(base_dir, ".env"))

    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        database_url = config.get_main_option("sqlalchemy.url")
        if database_url == "driver://user:pass@localhost/dbname":
            database_url = None

    if not database_url:
        raise RuntimeError(
            "DATABASE_URL must be set in the environment or backend/.env for Alembic migrations. "
            "Create backend/.env from backend/.env.example and provide the direct Postgres URL."
        )

    if is_pooler_url(database_url):
        raise RuntimeError(
            "DATABASE_URL must use the direct Supabase DB host (db.<ref>.supabase.co), not the transaction pooler host pooler.supabase.com."
        )

    return database_url


target_metadata = Base.metadata


def run_migrations_offline() -> None:
    database_url = get_database_url()
    context.configure(
        url=database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    database_url = get_database_url()
    config.set_main_option("sqlalchemy.url", database_url)

    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

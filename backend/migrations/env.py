"""
Alembic environment configuration for Lingvar database migrations.

Назначение:
- Контролирует способ применения миграций (через транзакцию и Connection, переданный CLI)
- Запрещает прямое выполнение `alembic upgrade` (требует контекста от backend/migrate.py)
- Защищает от применения миграций поверх неуправляемой существующей схемы
- Регистрирует ORM-модели (Base.metadata) для autogenerate

Поток:
1. backend/migrate.py создаёт Connection к БД
2. migrations.py проверяет состояние (check-legacy/baseline или обновление)
3. env.py получает Connection через context.attributes['connection']
4. Alembic применяет migrations.versions в рамках транзакции (rollback при ошибке)
5. advisory-lock и табличные блокировки синхронизируют конкурирующие операции

Безопасность:
- Проверка на неуправляемую schema перед initial (assert_upgrade_allowed)
- Защита baseline от публичного --force stamp
- Требование явного контекста для миграции (не допускает прямой alembic upgrade)
"""

from logging.config import fileConfig
import os

from alembic import context
from sqlalchemy import engine_from_config, pool

from services.base import Base
from services import migrations
import models.user  # Registers SQLAlchemy metadata for autogenerate.
import models.vocabulary  # Registers SQLAlchemy metadata for autogenerate.
import models.exercise  # Registers SQLAlchemy metadata for autogenerate.


config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def _configure(connection):
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
    )


def run_migrations_offline():
    raise RuntimeError("Offline Alembic migrations are not supported for Lingvar.")


def _run(connection):
    operation = config.attributes.get("lingvar_operation")
    if operation is None:
        command_option = getattr(getattr(config, "cmd_opts", None), "cmd", None)
        if isinstance(command_option, tuple):
            operation = command_option[0].__name__
        else:
            operation = command_option
    if operation == "stamp" and not config.attributes.get("lingvar_baseline_stamp"):
        raise RuntimeError(
            "Direct alembic stamp is disabled. Use `python -m migrate baseline` "
            "after check-legacy."
        )
    if operation != "stamp":
        migrations.assert_upgrade_allowed(connection)
    migrations.ensure_public_search_path(connection)

    _configure(connection)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    provided_connection = config.attributes.get("connection")
    if provided_connection is not None:
        _run(provided_connection)
        return

    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL must be explicitly set for Alembic.")
    config.set_main_option("sqlalchemy.url", database_url)
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.begin() as connection:
        _run(connection)


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

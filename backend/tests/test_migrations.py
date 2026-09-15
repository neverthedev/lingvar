"""End-to-end migration checks against the disposable PostgreSQL 15 service."""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.engine import make_url


BACKEND_DIRECTORY = Path(__file__).resolve().parents[1]
INITIAL_REVISION = "0001_initial_schema"
APPLICATION_TABLES = {
    "users",
    "nouns",
    "pronouns",
    "verbs",
    "numerators",
    "rules",
    "word_test_stats",
}


def _migration_command(command: str, database_url: str) -> subprocess.CompletedProcess[str]:
    environment = os.environ.copy()
    environment["DATABASE_URL"] = database_url
    return subprocess.run(
        [sys.executable, "-m", "migrate", command],
        cwd=BACKEND_DIRECTORY,
        env=environment,
        text=True,
        capture_output=True,
        check=False,
    )


def _alembic_downgrade(database_url: str) -> subprocess.CompletedProcess[str]:
    environment = os.environ.copy()
    environment["DATABASE_URL"] = database_url
    return subprocess.run(
        ["alembic", "-c", "alembic.ini", "downgrade", "base"],
        cwd=BACKEND_DIRECTORY,
        env=environment,
        text=True,
        capture_output=True,
        check=False,
    )


def _assert_startup_rejected(app) -> None:
    with pytest.raises(RuntimeError, match="Database migrations are unavailable or not current"):
        with TestClient(app):
            pass


def _application_tables(engine) -> set[str]:
    with engine.connect() as connection:
        return set(
            connection.execute(
                text(
                    "SELECT tablename FROM pg_tables "
                    "WHERE schemaname = 'public' AND tablename <> 'alembic_version'"
                )
            ).scalars()
        )


def test_initial_migration_lifecycle(test_engine, test_database_url):
    """A fresh database is usable only after the explicit migration command."""
    assert _migration_command("check", test_database_url).returncode != 0
    from main import app

    _assert_startup_rejected(app)
    assert _application_tables(test_engine) == set(), "startup must not call create_all"

    upgrade = _migration_command("upgrade", test_database_url)
    assert upgrade.returncode == 0, upgrade.stderr
    assert _application_tables(test_engine) == APPLICATION_TABLES
    with test_engine.connect() as connection:
        assert connection.execute(text("SELECT version_num FROM alembic_version")).scalar_one() == INITIAL_REVISION

    second_upgrade = _migration_command("upgrade", test_database_url)
    assert second_upgrade.returncode == 0, second_upgrade.stderr
    assert _application_tables(test_engine) == APPLICATION_TABLES
    assert _migration_command("check", test_database_url).returncode == 0

    with TestClient(app) as client:
        assert client.get("/api/health").json()["database"] == "connected"

    with test_engine.begin() as connection:
        connection.execute(text("DELETE FROM alembic_version"))
    _assert_startup_rejected(app)

    with test_engine.begin() as connection:
        connection.execute(text("INSERT INTO alembic_version (version_num) VALUES (:revision)"), {"revision": "unknown_revision"})
    _assert_startup_rejected(app)

    with test_engine.begin() as connection:
        connection.execute(text("UPDATE alembic_version SET version_num = :revision"), {"revision": INITIAL_REVISION})
    assert _migration_command("check", test_database_url).returncode == 0

    downgrade = _alembic_downgrade(test_database_url)
    assert downgrade.returncode != 0
    assert "Downgrade of the initial schema is forbidden" in (downgrade.stdout + downgrade.stderr)
    assert _application_tables(test_engine) == APPLICATION_TABLES
    assert _migration_command("check", test_database_url).returncode == 0


def test_startup_rejects_unavailable_database(test_database_url):
    # Import after the autouse fixture selected the dedicated URL, then change
    # only the runtime migration target for this negative lifecycle assertion.
    from main import app

    unavailable = make_url(test_database_url).set(database="lingvar_missing_test")
    previous = os.environ["DATABASE_URL"]
    os.environ["DATABASE_URL"] = str(unavailable)
    try:
        _assert_startup_rejected(app)
    finally:
        os.environ["DATABASE_URL"] = previous


def test_direct_stamp_is_forbidden(test_database_url):
    """Alembic stamp without baseline context must be rejected."""
    environment = os.environ.copy()
    environment["DATABASE_URL"] = test_database_url
    result = subprocess.run(
        ["alembic", "-c", "alembic.ini", "stamp", INITIAL_REVISION],
        cwd=BACKEND_DIRECTORY,
        env=environment,
        text=True,
        capture_output=True,
        check=False,
    )
    assert result.returncode != 0
    assert "Direct alembic stamp is disabled" in (result.stdout + result.stderr)

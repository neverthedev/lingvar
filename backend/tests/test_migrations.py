"""End-to-end migration checks against the disposable PostgreSQL 15 service."""
from __future__ import annotations

import os
import re
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.engine import make_url


BACKEND_DIRECTORY = Path(__file__).resolve().parents[1]
INITIAL_REVISION = "0001_initial_schema"
HEAD_REVISION = "0003_exercise_session_public_id"
APPLICATION_TABLES = {
    "users",
    "nouns",
    "pronouns",
    "verbs",
    "numerators",
    "rules",
    "word_test_stats",
    "exercises",
    "exercise_sessions",
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
        assert connection.execute(text("SELECT version_num FROM alembic_version")).scalar_one() == HEAD_REVISION

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
        connection.execute(text("UPDATE alembic_version SET version_num = :revision"), {"revision": HEAD_REVISION})
    assert _migration_command("check", test_database_url).returncode == 0

    downgrade = _alembic_downgrade(test_database_url)
    assert downgrade.returncode != 0
    assert "Downgrade of exercise session public identifiers is not supported" in (downgrade.stdout + downgrade.stderr)
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


def test_exercise_migration_upgrades_an_existing_exercise_schema(test_engine, test_database_url):
    """Revision 0003 backfills existing sessions without changing their creation time."""
    environment = os.environ.copy()
    environment["DATABASE_URL"] = test_database_url
    initial = subprocess.run(
        ["alembic", "-c", "alembic.ini", "upgrade", "0002_exercise_types"],
        cwd=BACKEND_DIRECTORY,
        env=environment,
        text=True,
        capture_output=True,
        check=False,
    )
    assert initial.returncode == 0, initial.stderr
    legacy_session_id = uuid4()
    created_at = datetime(2026, 1, 15, 12, 0, tzinfo=timezone.utc)
    with test_engine.begin() as connection:
        connection.execute(
            text(
                "INSERT INTO nouns (word, cases_pojed, cases_mnoga, cases_menska) "
                "VALUES ('kot-migration-qa', '{}'::jsonb, '{}'::jsonb, '{}'::jsonb)"
            )
        )
        user_id = connection.execute(text(
            "INSERT INTO users (username, email, hashed_password, is_active, is_superuser) "
            "VALUES ('migration-session-user', 'migration-session-user@example.com', 'hash', true, false) RETURNING id"
        )).scalar_one()
        exercise_id = connection.execute(text(
            "SELECT id FROM exercises WHERE slug = 'singular-nouns'"
        )).scalar_one()
        connection.execute(text(
            "INSERT INTO exercise_sessions (id, exercise_id, user_id, state, created_at, expires_at) "
            "VALUES (:id, :exercise_id, :user_id, '{}'::jsonb, :created_at, :legacy_expires_at)"
        ), {
            "id": legacy_session_id,
            "exercise_id": exercise_id,
            "user_id": user_id,
            "created_at": created_at,
            "legacy_expires_at": created_at + timedelta(minutes=30),
        })

    upgrade = _migration_command("upgrade", test_database_url)
    assert upgrade.returncode == 0, upgrade.stderr
    with test_engine.connect() as connection:
        assert connection.execute(text("SELECT version_num FROM alembic_version")).scalar_one() == HEAD_REVISION
        columns = set(connection.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_schema = 'public' AND table_name = 'exercise_sessions'"
        )).scalars())
        assert {"public_id", "revision"} <= columns
        public_id, revision, migrated_created_at, expires_at = connection.execute(text(
            "SELECT public_id, revision, created_at, expires_at FROM exercise_sessions WHERE id = :id"
        ), {"id": legacy_session_id}).one()
        assert re.fullmatch(r"[A-Za-z0-9_-]{22}", public_id)
        assert revision == 1
        assert migrated_created_at == created_at
        assert expires_at == created_at + timedelta(hours=24)
        catalog = connection.execute(
            text("SELECT slug, type_code, schema_version, status, title, description FROM exercises ORDER BY display_order, id")
        ).mappings().all()
        assert [(row["slug"], row["type_code"], row["title"], row["description"]) for row in catalog] == [
            ("singular-nouns", "form_table", "Singular Nouns", "Practice identifying and using singular nouns in different contexts. Learn the basics of noun usage."),
            ("pronouns", "form_table", "Pronouns", "Learn about different types of pronouns and their usage in sentences."),
            ("verbs", "form_table", "Verbs", "Master Polish verb conjugation across different personal pronouns and practice with various examples."),
            ("dopelniacz-pojed", "self_check", "Dopełniacz (Genitive Case) Liczby Pojedynczej", "Practice identifying and using singular nouns in different contexts. Learn the basics of noun usage."),
            ("dopelniacz-mnoga", "self_check", "Dopełniacz (Genitive Case) Liczby Mnogiej", "Practice identifying and using plural nouns in different contexts. Learn the basics of noun usage."),
            ("numerators", "single_input", "Liczebniki (Numerals)", "Practice Polish numerals and their Russian translations. Learn different forms of numbers."),
            ("mianowniki-mnoga", "single_input", "Mianownik Liczny Mnogej", "Practice Polish nouns in nominative plural case with their Russian translations. Learn different forms of plural nouns."),
        ]
        assert all(row["schema_version"] == 1 and row["status"] == "published" for row in catalog)
        assert connection.execute(text("SELECT count(*) FROM nouns WHERE word = 'kot-migration-qa'")).scalar_one() == 1

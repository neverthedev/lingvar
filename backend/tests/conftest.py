"""Shared isolation for PostgreSQL integration tests."""
from __future__ import annotations

import os

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL, make_url


TEST_DATABASE_NAME = "lingvar_test"
TEST_DATABASE_HOST = "postgres-test"
TEST_DATABASE_USER = "lingvar_test_user"


def _test_database_url() -> URL:
    raw_url = os.environ.get("TEST_DATABASE_URL")
    if not raw_url:
        pytest.exit("TEST_DATABASE_URL must be explicitly set before running integration tests.")

    url = make_url(raw_url)
    if (
        url.get_backend_name() != "postgresql"
        or url.database != TEST_DATABASE_NAME
        or url.host != TEST_DATABASE_HOST
        or url.username != TEST_DATABASE_USER
    ):
        pytest.exit(
            "TEST_DATABASE_URL must point to the dedicated PostgreSQL test service "
            f"{TEST_DATABASE_HOST!r} as {TEST_DATABASE_USER!r} using database "
            f"{TEST_DATABASE_NAME!r}; refusing any DDL."
        )
    return url


def _reset_public_schema(engine) -> None:
    with engine.begin() as connection:
        database_name = connection.execute(text("SELECT current_database()")).scalar_one()
        current_user = connection.execute(text("SELECT current_user")).scalar_one()
        version = int(connection.execute(text("SHOW server_version_num")).scalar_one())
        if (
            database_name != TEST_DATABASE_NAME
            or current_user != TEST_DATABASE_USER
            or not 150000 <= version < 160000
        ):
            pytest.exit(
                "Refusing DDL outside the dedicated PostgreSQL 15 test database and user."
            )
        connection.execute(text("DROP SCHEMA public CASCADE"))
        connection.execute(text("CREATE SCHEMA public"))


@pytest.fixture(scope="session")
def test_database_url() -> str:
    """The only URL from which integration tests configure the backend."""
    return _test_database_url().render_as_string(hide_password=False)


@pytest.fixture(scope="function", autouse=True)
def test_engine(test_database_url):
    engine = create_engine(test_database_url, pool_pre_ping=True)
    _reset_public_schema(engine)
    try:
        yield engine
    finally:
        _reset_public_schema(engine)
        engine.dispose()


@pytest.fixture(scope="session", autouse=True)
def configure_backend_database(test_database_url):
    """Never inherit DATABASE_URL from .env or the ordinary Compose project."""
    previous = os.environ.get("DATABASE_URL")
    os.environ["DATABASE_URL"] = test_database_url
    try:
        yield
    finally:
        if previous is None:
            os.environ.pop("DATABASE_URL", None)
        else:
            os.environ["DATABASE_URL"] = previous

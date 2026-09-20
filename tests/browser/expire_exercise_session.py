"""Expire one session only in the disposable browser-test database."""
from __future__ import annotations

import os
import sys

from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url


TEST_DATABASE_NAME = "lingvar_test"
TEST_DATABASE_HOST = "postgres-test"
TEST_DATABASE_USER = "lingvar_test_user"


def main(public_id: str) -> None:
    url = make_url(os.environ["TEST_DATABASE_URL"])
    if (
        url.get_backend_name() != "postgresql"
        or url.database != TEST_DATABASE_NAME
        or url.host != TEST_DATABASE_HOST
        or url.username != TEST_DATABASE_USER
    ):
        raise RuntimeError("Refusing to expire a session outside the dedicated browser-test database.")

    engine = create_engine(url)
    try:
        with engine.begin() as connection:
            if (
                connection.execute(text("SELECT current_database()")).scalar_one() != TEST_DATABASE_NAME
                or connection.execute(text("SELECT current_user")).scalar_one() != TEST_DATABASE_USER
            ):
                raise RuntimeError("Refusing to use an unexpected PostgreSQL database or user.")
            updated = connection.execute(
                text(
                    "UPDATE exercise_sessions "
                    "SET created_at = NOW() - INTERVAL '24 hours 1 second', "
                    "expires_at = NOW() - INTERVAL '1 second' "
                    "WHERE public_id = :public_id"
                ),
                {"public_id": public_id},
            ).rowcount
            if updated != 1:
                raise RuntimeError("Expected exactly one test session to expire.")
    finally:
        engine.dispose()


if __name__ == "__main__":
    main(sys.argv[1])

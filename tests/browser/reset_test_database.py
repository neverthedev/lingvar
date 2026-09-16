"""Reset only the dedicated browser-test PostgreSQL schema before an e2e run."""
from __future__ import annotations

import os

from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url


TEST_DATABASE_NAME = "lingvar_test"
TEST_DATABASE_HOST = "postgres-test"
TEST_DATABASE_USER = "lingvar_test_user"


def main() -> None:
    database_url = os.environ["TEST_DATABASE_URL"]
    url = make_url(database_url)
    if (
        url.get_backend_name() != "postgresql"
        or url.database != TEST_DATABASE_NAME
        or url.host != TEST_DATABASE_HOST
        or url.username != TEST_DATABASE_USER
    ):
        raise RuntimeError("Refusing to reset a database outside the dedicated browser-test service.")

    engine = create_engine(database_url)
    try:
        with engine.begin() as connection:
            database_name = connection.execute(text("SELECT current_database()")).scalar_one()
            current_user = connection.execute(text("SELECT current_user")).scalar_one()
            if database_name != TEST_DATABASE_NAME or current_user != TEST_DATABASE_USER:
                raise RuntimeError("Refusing to reset an unexpected PostgreSQL database or user.")
            connection.execute(text("DROP SCHEMA public CASCADE"))
            connection.execute(text("CREATE SCHEMA public"))
    finally:
        engine.dispose()


if __name__ == "__main__":
    main()

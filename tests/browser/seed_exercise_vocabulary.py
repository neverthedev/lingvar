"""Seed deterministic vocabulary only in the disposable browser-test database."""
from __future__ import annotations

import os

from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url


TEST_DATABASE_NAME = "lingvar_test"
TEST_DATABASE_HOST = "postgres-test"
TEST_DATABASE_USER = "lingvar_test_user"


def main() -> None:
    url = make_url(os.environ["TEST_DATABASE_URL"])
    if (
        url.get_backend_name() != "postgresql"
        or url.database != TEST_DATABASE_NAME
        or url.host != TEST_DATABASE_HOST
        or url.username != TEST_DATABASE_USER
    ):
        raise RuntimeError("Refusing to seed vocabulary outside the dedicated browser-test database.")

    engine = create_engine(url)
    try:
        with engine.begin() as connection:
            if (
                connection.execute(text("SELECT current_database()")).scalar_one() != TEST_DATABASE_NAME
                or connection.execute(text("SELECT current_user")).scalar_one() != TEST_DATABASE_USER
            ):
                raise RuntimeError("Refusing to seed an unexpected PostgreSQL database or user.")
            connection.execute(
                text(
                    "INSERT INTO nouns (word, cases_pojed, cases_mnoga, cases_menska) "
                    "VALUES (:word, CAST(:singular AS jsonb), CAST(:plural AS jsonb), '{}'::jsonb)"
                ),
                {
                    "word": "kot-browser-qa",
                    "singular": '{"mianownik":"kot-browser-qa","dopełniacz":"kota-browser-qa","celownik":"kotu-browser-qa","biernik":"kota-browser-qa","narzędnik":"kotem-browser-qa","miejscownik":"kocie-browser-qa","wołacz":"kocie-browser-qa"}',
                    "plural": '{"mianownik":"koty-browser-qa","dopełniacz":"kotów-browser-qa"}',
                },
            )
            connection.execute(
                text("INSERT INTO numerators (word, translation) VALUES ('jeden-browser-qa', 'one-browser-qa')")
            )
    finally:
        engine.dispose()


if __name__ == "__main__":
    main()

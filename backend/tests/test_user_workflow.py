"""HTTP integration workflows against the isolated PostgreSQL test database."""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import text


BACKEND_DIRECTORY = Path(__file__).resolve().parents[1]


def _upgrade_schema(database_url: str) -> None:
    environment = os.environ.copy()
    environment["DATABASE_URL"] = database_url
    result = subprocess.run(
        [sys.executable, "-m", "migrate", "upgrade"],
        cwd=BACKEND_DIRECTORY,
        env=environment,
        text=True,
        capture_output=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr


def test_registered_user_can_save_table_exercise_result(test_engine, test_database_url):
    """Registration through saving a table-exercise result uses real HTTP and PostgreSQL."""
    _upgrade_schema(test_database_url)
    with test_engine.begin() as connection:
        noun_id = connection.execute(
            text(
                "INSERT INTO nouns (word, cases_pojed, cases_mnoga, cases_menska) "
                "VALUES (:word, CAST(:singular AS jsonb), CAST(:plural AS jsonb), "
                "CAST(:masculine AS jsonb)) RETURNING id"
            ),
            {
                "word": "kot-workflow-qa",
                "singular": '{"mianownik": "kot-workflow-qa"}',
                "plural": '{"mianownik": "koty-workflow-qa"}',
                "masculine": '{"mianownik": "koty-workflow-qa"}',
            },
        ).scalar_one()

    from main import app

    registration_payload = {
        "username": "workflow-qa",
        "email": "workflow-qa@example.com",
        "password": "safe-password-8",
    }
    with TestClient(app) as client:
        registration = client.post("/users/register", json=registration_payload)
        assert registration.status_code == 200, registration.text
        registered_user = registration.json()
        assert registered_user["username"] == registration_payload["username"]
        assert registered_user["email"] == registration_payload["email"]

        token = client.post(
            "/users/token",
            data={"username": registration_payload["username"], "password": registration_payload["password"]},
        )
        assert token.status_code == 200, token.text
        authorization = {"Authorization": f"Bearer {token.json()['access_token']}"}

        current_user = client.get("/users/me", headers=authorization)
        assert current_user.status_code == 200, current_user.text
        assert current_user.json()["id"] == registered_user["id"]

        nouns = client.get("/api/nouns/single", headers=authorization)
        assert nouns.status_code == 200, nouns.text
        assert any(noun["id"] == noun_id for noun in nouns.json())

        attempt = client.post(
            "/api/tests/attempt",
            headers=authorization,
            json={"word_type": "noun", "word_id": noun_id, "is_correct": True},
        )
        assert attempt.status_code == 200, attempt.text
        assert attempt.json() == {"ok": True}
        completion = client.post(
            "/api/tests/complete",
            headers=authorization,
            json={"word_type": "noun", "word_id": noun_id, "all_correct": True},
        )
        assert completion.status_code == 200, completion.text
        assert completion.json() == {"ok": True}

    with test_engine.connect() as connection:
        stat = connection.execute(
            text(
                "SELECT attempts, correct, last_correct, last_tested_at "
                "FROM word_test_stats "
                "WHERE user_id = :user_id AND word_type = 'noun' AND word_id = :word_id"
            ),
            {"user_id": registered_user["id"], "word_id": noun_id},
        ).mappings().one()
    assert stat["attempts"] == 1
    assert stat["correct"] == 1
    assert stat["last_correct"] is True
    assert stat["last_tested_at"] is not None


def test_repeat_registration_does_not_create_a_second_user(test_engine, test_database_url):
    _upgrade_schema(test_database_url)
    from main import app

    registration_payload = {
        "username": "duplicate-qa",
        "email": "duplicate-qa@example.com",
        "password": "safe-password-8",
    }
    with TestClient(app) as client:
        first_registration = client.post("/users/register", json=registration_payload)
        assert first_registration.status_code == 200, first_registration.text
        duplicate_registration = client.post("/users/register", json=registration_payload)
        assert duplicate_registration.status_code == 400, duplicate_registration.text
        assert duplicate_registration.json() == {"detail": "Username or email already registered"}

    with test_engine.connect() as connection:
        user_count = connection.execute(
            text("SELECT count(*) FROM users"),
        ).scalar_one()
    assert user_count == 1

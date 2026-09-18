"""Exercise administration and server-checked fill-blanks integration workflows."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from sqlalchemy import text

from helpers import authorization_header, create_admin, upgrade_schema


def _admin_headers(client: TestClient, database_url: str) -> dict[str, str]:
    created = create_admin(database_url, "exercise-admin-qa", "exercise-admin-qa@example.com", "safe-admin-password-8")
    assert created.returncode == 0, created.stderr
    return authorization_header(client, "exercise-admin-qa", "safe-admin-password-8")


def _student_headers(client: TestClient, username: str = "exercise-student-qa") -> dict[str, str]:
    registration = client.post("/users/register", json={
        "username": username,
        "email": f"{username}@example.com",
        "password": "safe-student-password-8",
    })
    assert registration.status_code == 200, registration.text
    return authorization_header(client, username, "safe-student-password-8")


def _fill_definition() -> dict:
    return {"items": [{"id": "sentence-1", "parts": [
        {"kind": "text", "text": "Mam "},
        {"kind": "blank", "id": "blank-cat", "hint": "kot", "accepted_answers": ["kota"]},
        {"kind": "text", "text": " i "},
        {"kind": "blank", "id": "blank-dog", "hint": None, "accepted_answers": ["psa", "pieska"]},
        {"kind": "text", "text": "; "},
        {"kind": "blank", "id": "blank-phrase", "hint": None, "accepted_answers": ["biały kot"]},
        {"kind": "text", "text": " oraz "},
        {"kind": "blank", "id": "blank-turtle", "hint": None, "accepted_answers": ["żółw"]},
        {"kind": "text", "text": "."},
    ]}]}


def _exercise_payload(type_code: str, definition: dict, *, slug: str, status: str = "draft") -> dict:
    return {
        "slug": slug, "type_code": type_code, "schema_version": 1,
        "title": f"QA {type_code}", "description": "Integration exercise",
        "instruction": "Complete the exercise", "difficulty": "beginner",
        "estimated_duration_minutes": 5, "display_order": 50, "status": status,
        "definition": definition,
    }


def test_administrator_validates_and_manages_each_supported_exercise_type(test_engine, test_database_url):
    """Admin CRUD validates type-specific definitions and publication controls learner access."""
    upgrade_schema(test_database_url)
    from main import app

    definitions = {
        "form_table": {"source_code": "nouns_singular_cases", "sample_size": 1, "max_attempts": 3,
                       "columns": [{"key": "dopełniacz", "label": "Dopełniacz"}]},
        "single_input": {"source_code": "numerators_translation_to_word", "sample_size": 1,
                         "max_attempts": 3, "reveal_after_exhaustion": True},
        "self_check": {"source_code": "nouns_singular_genitive", "sample_size": 1},
        "fill_blanks": _fill_definition(),
    }
    with TestClient(app) as client:
        admin = _admin_headers(client, test_database_url)
        types = client.get("/admin/exercise-types", headers=admin)
        assert types.status_code == 200, types.text
        assert {(item["code"], item["schema_version"]) for item in types.json()} == {
            ("form_table", 1), ("single_input", 1), ("self_check", 1), ("fill_blanks", 1)
        }

        created = {}
        for type_code, definition in definitions.items():
            slug = f"qa-{type_code.replace('_', '-')}"
            response = client.post("/admin/exercises", headers=admin, json=_exercise_payload(type_code, definition, slug=slug))
            assert response.status_code == 201, response.text
            created[type_code] = response.json()
            assert created[type_code]["status"] == "draft"
            replacement = _exercise_payload(type_code, definition, slug="ignored")
            for immutable in ("slug", "type_code", "schema_version"):
                replacement.pop(immutable)
            replacement["title"] = f"Updated QA {type_code}"
            updated = client.put(f"/admin/exercises/{created[type_code]['id']}", headers=admin, json=replacement)
            assert updated.status_code == 200, updated.text
            assert updated.json()["title"] == replacement["title"]

        student = _student_headers(client)
        assert all(item["slug"] != "qa-fill-blanks" for item in client.get("/api/exercises/", headers=student).json())
        assert client.get("/api/exercises/qa-fill-blanks/content", headers=student).status_code == 404

        fill = created["fill_blanks"]
        update = _exercise_payload("fill_blanks", _fill_definition(), slug="ignored", status="published")
        update.pop("slug"); update.pop("type_code"); update.pop("schema_version")
        update["title"] = "Published fill blanks"
        published = client.put(f"/admin/exercises/{fill['id']}", headers=admin, json=update)
        assert published.status_code == 200, published.text
        assert published.json()["slug"] == "qa-fill-blanks"
        assert published.json()["status"] == "published"
        listed = client.get("/api/exercises/", headers=student)
        assert [item["slug"] for item in listed.json()].count("qa-fill-blanks") == 1
        content = client.get("/api/exercises/qa-fill-blanks/content", headers=student)
        assert content.status_code == 200, content.text
        assert "accepted_answers" not in str(content.json())
        assert content.json()["content"]["items"][0]["parts"][1] == {"kind": "blank", "id": "blank-cat", "hint": "kot"}

        unpublished = client.put(f"/admin/exercises/{fill['id']}", headers=admin, json={**update, "status": "draft"})
        assert unpublished.status_code == 200, unpublished.text
        assert client.get("/api/exercises/qa-fill-blanks/content", headers=student).status_code == 404
        assert client.get("/admin/exercises/999999", headers=admin).status_code == 404

        rejected_payloads = [
            _exercise_payload("unknown", {}, slug="qa-unknown"),
            _exercise_payload("fill_blanks", _fill_definition(), slug="qa-version") | {"schema_version": 2},
            _exercise_payload("form_table", {
                "source_code": "numerators_translation_to_word", "sample_size": 1, "max_attempts": 3,
                "columns": [{"key": "dopełniacz", "label": "Dopełniacz"}],
            }, slug="qa-wrong-source"),
            _exercise_payload("form_table", {
                "source_code": "nouns_singular_cases", "sample_size": 1, "max_attempts": 3,
                "columns": [{"key": "ja", "label": "Ja"}],
            }, slug="qa-wrong-column"),
            _exercise_payload("fill_blanks", {"items": [{"id": "sentence-1", "parts": [
                {"kind": "text", "text": "   "},
                {"kind": "blank", "id": "blank", "hint": None, "accepted_answers": ["answer"]},
            ]}]}, slug="qa-blank-text"),
            _exercise_payload("fill_blanks", {"items": [{"id": "sentence-1", "parts": [
                {"kind": "blank", "id": "same", "hint": None, "accepted_answers": ["answer"]},
                {"kind": "blank", "id": "same", "hint": None, "accepted_answers": ["other"]},
            ]}]}, slug="qa-duplicate"),
            _exercise_payload("fill_blanks", {"items": [{"id": "sentence-1", "parts": [
                {"kind": "blank", "id": "blank", "hint": None, "accepted_answers": ["   "]},
            ]}]}, slug="qa-empty-answer"),
        ]
        for payload in rejected_payloads:
            response = client.post("/admin/exercises", headers=admin, json=payload)
            assert response.status_code == 422, response.text
        unknown = client.post("/admin/exercises", headers=admin, json=rejected_payloads[0])
        assert {tuple(issue["loc"]) for issue in unknown.json()["detail"]} == {
            ("body", "type_code"), ("body", "schema_version"),
        }
        unsupported_version = client.post("/admin/exercises", headers=admin, json=rejected_payloads[1])
        assert {tuple(issue["loc"]) for issue in unsupported_version.json()["detail"]} == {
            ("body", "type_code"), ("body", "schema_version"),
        }
        wrong_source = client.post("/admin/exercises", headers=admin, json=rejected_payloads[2])
        assert wrong_source.json()["detail"] == [{
            "loc": ["body", "definition", "source_code"],
            "msg": "Недопустимый источник словаря",
            "type": "value_error",
        }]
        wrong_column = client.post("/admin/exercises", headers=admin, json=rejected_payloads[3])
        assert wrong_column.json()["detail"] == [{
            "loc": ["body", "definition", "columns", 0, "key"],
            "msg": "Колонка несовместима с выбранным источником",
            "type": "value_error",
        }]
        blank_text = client.post("/admin/exercises", headers=admin, json=rejected_payloads[4])
        blank_text_locations = [issue["loc"] for issue in blank_text.json()["detail"]]
        assert any(
            location[:6] == ["body", "definition", "items", 0, "parts", 0] and location[-1] == "text"
            for location in blank_text_locations
        ), blank_text.json()
        empty_answer = client.post("/admin/exercises", headers=admin, json=rejected_payloads[-1])
        assert any(
            issue["loc"][-1] == "accepted_answers" and "пустым" in issue["msg"]
            for issue in empty_answer.json()["detail"]
        )
        duplicate = client.post("/admin/exercises", headers=admin, json=_exercise_payload("self_check", definitions["self_check"], slug="qa-self-check"))
        assert duplicate.status_code == 409, duplicate.text


def test_legacy_exercise_endpoints_keep_their_original_flat_payloads_via_shared_sources(test_engine, test_database_url):
    """Compatibility wrappers still expose old shapes while using named source handlers."""
    upgrade_schema(test_database_url)
    with test_engine.begin() as connection:
        noun_id = connection.execute(text(
            "INSERT INTO nouns (word, cases_pojed, cases_mnoga, cases_menska) VALUES "
            "('kot-legacy-qa', CAST(:singular AS jsonb), CAST(:plural AS jsonb), '{}'::jsonb) RETURNING id"
        ), {
            "singular": '{"mianownik":"kot-legacy-qa","dopełniacz":"kota-legacy-qa","celownik":"kotu-legacy-qa","biernik":"kota-legacy-qa","narzędnik":"kotem-legacy-qa","miejscownik":"kocie-legacy-qa","wołacz":"kocie-legacy-qa"}',
            "plural": '{"mianownik":"koty-legacy-qa","dopełniacz":"kotów-legacy-qa"}',
        }).scalar_one()
        pronoun_id = connection.execute(text(
            "INSERT INTO pronouns (word, cases) VALUES ('ja-legacy-qa', CAST(:cases AS jsonb)) RETURNING id"
        ), {"cases": '{"mianownik":"ja-legacy-qa","dopełniacz":"mnie-legacy-qa","celownik":"mi-legacy-qa","biernik":"mnie-legacy-qa","narzędnik":"mną-legacy-qa","miejscownik":"mnie-legacy-qa","wołacz":"ja-legacy-qa"}'}).scalar_one()
        verb_id = connection.execute(text(
            "INSERT INTO verbs (word, cases) VALUES ('być-legacy-qa', CAST(:cases AS jsonb)) RETURNING id"
        ), {"cases": '{"ja":"jestem-legacy-qa","ty":"jesteś-legacy-qa","ono":"jest-legacy-qa","my":"jesteśmy-legacy-qa","wy":"jesteście-legacy-qa","one":"są-legacy-qa"}'}).scalar_one()
        numerator_id = connection.execute(text(
            "INSERT INTO numerators (word, translation) VALUES ('jeden-legacy-qa', 'one-legacy-qa') RETURNING id"
        )).scalar_one()

    from main import app
    with TestClient(app) as client:
        student = _student_headers(client, "legacy-endpoints-student-qa")
        assert client.get("/api/exercises/dopelniacz/pojed", headers=student).json() == [{
            "id": str(noun_id), "word": "kot-legacy-qa", "dopelniacz": "kota-legacy-qa",
        }]
        assert client.get("/api/exercises/dopelniacz/mnoga", headers=student).json() == [{
            "id": str(noun_id), "word": "kot-legacy-qa", "dopelniacz": "kotów-legacy-qa",
        }]
        assert client.get("/api/exercises/numerators/", headers=student).json() == [{
            "id": str(numerator_id), "word": "jeden-legacy-qa", "description": "one-legacy-qa",
        }]
        assert client.get("/api/exercises/mianownik/mnoga", headers=student).json() == [{
            "id": str(noun_id), "word": "koty-legacy-qa", "description": "kot-legacy-qa",
        }]
        assert client.get("/api/nouns/single", headers=student).json() == [{
            "id": noun_id, "word": "kot-legacy-qa", "mianownik": "kot-legacy-qa",
            "dopełniacz": "kota-legacy-qa", "celownik": "kotu-legacy-qa",
            "biernik": "kota-legacy-qa", "narzędnik": "kotem-legacy-qa",
            "miejscownik": "kocie-legacy-qa", "wołacz": "kocie-legacy-qa",
        }]
        assert client.get("/api/pronouns/", headers=student).json() == [{
            "id": pronoun_id, "word": "ja-legacy-qa", "mianownik": "ja-legacy-qa",
            "dopełniacz": "mnie-legacy-qa", "celownik": "mi-legacy-qa",
            "biernik": "mnie-legacy-qa", "narzędnik": "mną-legacy-qa",
            "miejscownik": "mnie-legacy-qa", "wołacz": "ja-legacy-qa",
        }]
        assert client.get("/api/verbs/", headers=student).json() == [{
            "id": verb_id, "word": "być-legacy-qa", "weight": 0,
            "ja": "jestem-legacy-qa", "ty": "jesteś-legacy-qa", "ono": "jest-legacy-qa",
            "my": "jesteśmy-legacy-qa", "wy": "jesteście-legacy-qa", "one": "są-legacy-qa",
        }]


def test_fill_blanks_server_session_isolated_expires_and_counts_each_blank_independently(test_engine, test_database_url):
    """A server session keeps a private snapshot, per-blank attempts, and lazily purges TTL rows."""
    upgrade_schema(test_database_url)
    from main import app

    with TestClient(app) as client:
        admin = _admin_headers(client, test_database_url)
        created = client.post("/admin/exercises", headers=admin, json=_exercise_payload("fill_blanks", _fill_definition(), slug="qa-session", status="published"))
        assert created.status_code == 201, created.text
        student = _student_headers(client)
        other_student = _student_headers(client, "other-exercise-student-qa")

        first = client.post("/api/exercises/qa-session/sessions", headers=student)
        second = client.post("/api/exercises/qa-session/sessions", headers=student)
        assert first.status_code == second.status_code == 201
        first_id = first.json()["session_id"]
        second_id = second.json()["session_id"]
        assert first_id != second_id
        assert all("accepted_answers" not in str(state) for state in first.json()["blanks"])
        with test_engine.connect() as connection:
            created_at, expires_at, state_snapshot = connection.execute(
                text("SELECT created_at, expires_at, state FROM exercise_sessions WHERE id = CAST(:id AS uuid)"),
                {"id": first_id},
            ).one()
        assert timedelta(hours=23, minutes=59, seconds=59) <= expires_at - created_at <= timedelta(hours=24, seconds=1)
        assert state_snapshot["blanks"]["blank-cat"]["accepted_answers"] == ["kota"]
        assert client.post(f"/api/exercise-sessions/{first_id}/blanks/blank-cat/check", headers=other_student, json={"answer": "kota"}).status_code == 404
        assert client.post(f"/api/exercise-sessions/{first_id}/blanks/missing/check", headers=student, json={"answer": "x"}).status_code == 404

        stale_for_rejected_check = client.post("/api/exercises/qa-session/sessions", headers=student).json()["session_id"]
        with test_engine.begin() as connection:
            connection.execute(text("UPDATE exercise_sessions SET expires_at = :expired WHERE id = CAST(:id AS uuid)"), {
                "expired": datetime.now(timezone.utc) - timedelta(seconds=1), "id": stale_for_rejected_check,
            })
        empty = client.post(f"/api/exercise-sessions/{first_id}/blanks/blank-cat/check", headers=student, json={"answer": "  "})
        assert empty.status_code == 422
        with test_engine.connect() as connection:
            assert connection.execute(text("SELECT count(*) FROM exercise_sessions WHERE id = CAST(:id AS uuid)"), {
                "id": stale_for_rejected_check,
            }).scalar_one() == 0

        wrong_one = client.post(f"/api/exercise-sessions/{first_id}/blanks/blank-cat/check", headers=student, json={"answer": "kota!"})
        assert wrong_one.status_code == 200, wrong_one.text
        cat_after_one = next(state for state in wrong_one.json()["blanks"] if state["id"] == "blank-cat")
        dog_after_one = next(state for state in wrong_one.json()["blanks"] if state["id"] == "blank-dog")
        assert cat_after_one == {"id": "blank-cat", "value": "kota!", "attempts_used": 1, "status": "open", "last_check": "incorrect"}
        assert dog_after_one["attempts_used"] == 0

        changed_definition = _fill_definition()
        changed_definition["items"][0]["parts"][1]["accepted_answers"] = ["zmieniona-forma"]
        changed = _exercise_payload("fill_blanks", changed_definition, slug="ignored", status="published")
        changed.pop("slug"); changed.pop("type_code"); changed.pop("schema_version")
        assert client.put(f"/admin/exercises/{created.json()['id']}", headers=admin, json=changed).status_code == 200

        # The started run keeps its original answer snapshot despite the admin edit.
        original_snapshot_answer = client.post(f"/api/exercise-sessions/{first_id}/blanks/blank-cat/check", headers=student, json={"answer": "  KOTA  "})
        assert next(state for state in original_snapshot_answer.json()["blanks"] if state["id"] == "blank-cat")["status"] == "correct"
        # Internal whitespace and diacritics remain significant; only outer whitespace and case fold.
        phrase_wrong = client.post(f"/api/exercise-sessions/{first_id}/blanks/blank-phrase/check", headers=student, json={"answer": "biały  kot"})
        assert next(state for state in phrase_wrong.json()["blanks"] if state["id"] == "blank-phrase")["status"] == "open"
        phrase_correct = client.post(f"/api/exercise-sessions/{first_id}/blanks/blank-phrase/check", headers=student, json={"answer": " BIAŁY KOT "})
        assert next(state for state in phrase_correct.json()["blanks"] if state["id"] == "blank-phrase")["status"] == "correct"
        turtle_wrong = client.post(f"/api/exercise-sessions/{first_id}/blanks/blank-turtle/check", headers=student, json={"answer": "zolw"})
        assert next(state for state in turtle_wrong.json()["blanks"] if state["id"] == "blank-turtle")["status"] == "open"
        turtle_correct = client.post(f"/api/exercise-sessions/{first_id}/blanks/blank-turtle/check", headers=student, json={"answer": "ŻÓŁW"})
        assert next(state for state in turtle_correct.json()["blanks"] if state["id"] == "blank-turtle")["status"] == "correct"

        client.post(f"/api/exercise-sessions/{first_id}/blanks/blank-dog/check", headers=student, json={"answer": "wrong"})
        client.post(f"/api/exercise-sessions/{first_id}/blanks/blank-dog/check", headers=student, json={"answer": "wrong again"})
        exhausted = client.post(f"/api/exercise-sessions/{first_id}/blanks/blank-dog/check", headers=student, json={"answer": "wrong third"})
        assert exhausted.status_code == 200, exhausted.text
        dog_exhausted = next(state for state in exhausted.json()["blanks"] if state["id"] == "blank-dog")
        assert dog_exhausted["status"] == "exhausted"
        assert dog_exhausted["attempts_used"] == 3
        assert dog_exhausted["revealed_answers"] == ["psa", "pieska"]
        assert client.post(f"/api/exercise-sessions/{first_id}/blanks/blank-dog/check", headers=student, json={"answer": "psa"}).status_code == 409

        with test_engine.begin() as connection:
            connection.execute(text("UPDATE exercise_sessions SET expires_at = :expired WHERE id = CAST(:id AS uuid)"), {"expired": datetime.now(timezone.utc) - timedelta(seconds=1), "id": second_id})
        assert client.post(f"/api/exercise-sessions/{second_id}/blanks/blank-cat/check", headers=student, json={"answer": "kota"}).status_code == 410
        with test_engine.connect() as connection:
            assert connection.execute(text("SELECT count(*) FROM exercise_sessions WHERE id = CAST(:id AS uuid)"), {"id": second_id}).scalar_one() == 0

        stale = client.post("/api/exercises/qa-session/sessions", headers=student).json()["session_id"]
        with test_engine.begin() as connection:
            connection.execute(text("UPDATE exercise_sessions SET expires_at = :expired WHERE id = CAST(:id AS uuid)"), {"expired": datetime.now(timezone.utc) - timedelta(seconds=1), "id": stale})
        fresh = client.post("/api/exercises/qa-session/sessions", headers=student)
        assert fresh.status_code == 201, fresh.text
        with test_engine.connect() as connection:
            assert connection.execute(text("SELECT count(*) FROM exercise_sessions WHERE id = CAST(:id AS uuid)"), {"id": stale}).scalar_one() == 0

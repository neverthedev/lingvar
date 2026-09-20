"""Exercise administration and server-checked fill-blanks integration workflows."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
import re

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


def test_public_sessions_restore_all_types_and_keep_a_fixed_ttl(test_engine, test_database_url):
    """All four mechanisms use private, replay-safe snapshots with a fixed lifetime."""
    upgrade_schema(test_database_url)
    with test_engine.begin() as connection:
        noun_id = connection.execute(text(
            "INSERT INTO nouns (word, cases_pojed, cases_mnoga, cases_menska) VALUES "
            "('kot-session-qa', CAST(:singular AS jsonb), '{}'::jsonb, '{}'::jsonb) RETURNING id"
        ), {"singular": '{"mianownik":"kot-session-qa","dopełniacz":"kota-session-qa"}'}).scalar_one()
        numerator_id = connection.execute(text(
            "INSERT INTO numerators (word, translation) VALUES ('jeden-session-qa', 'one-session-qa') RETURNING id"
        )).scalar_one()

    from main import app
    with TestClient(app) as client:
        admin = _admin_headers(client, test_database_url)
        definitions = {
            "form": ("form_table", {"source_code": "nouns_singular_cases", "sample_size": 1, "max_attempts": 3, "columns": [{"key": "dopełniacz", "label": "Dopełniacz"}]}),
            "single": ("single_input", {"source_code": "numerators_translation_to_word", "sample_size": 1, "max_attempts": 3, "reveal_after_exhaustion": True}),
            "self": ("self_check", {"source_code": "nouns_singular_genitive", "sample_size": 1}),
            "fill": ("fill_blanks", _fill_definition()),
        }
        exercise_ids = {}
        for name, (type_code, definition) in definitions.items():
            response = client.post("/admin/exercises", headers=admin, json=_exercise_payload(type_code, definition, slug=f"qa-session-{name}", status="published"))
            assert response.status_code == 201, response.text
            exercise_ids[name] = response.json()["id"]

        student = _student_headers(client)
        other_student = _student_headers(client, "other-exercise-student-qa")
        sessions = {}
        for name in definitions:
            response = client.post(f"/api/exercises/qa-session-{name}/sessions", headers=student)
            assert response.status_code == 201, response.text
            snapshot = response.json()
            assert re.fullmatch(r"[A-Za-z0-9_-]{22}", snapshot["session_id"])
            assert "accepted_answers" not in str(snapshot)
            sessions[name] = snapshot

        form_id = sessions["form"]["session_id"]
        with test_engine.connect() as connection:
            internal_id, created_at, expires_at, state = connection.execute(text(
                "SELECT id, created_at, expires_at, state FROM exercise_sessions WHERE public_id = :id"
            ), {"id": form_id}).one()
        assert str(internal_id) != form_id
        assert expires_at - created_at == timedelta(hours=24)
        assert state["answers"][str(noun_id)]["dopełniacz"] == "kota-session-qa"

        for name, snapshot in sessions.items():
            recovered = client.get(f"/api/exercises/qa-session-{name}/sessions/{snapshot['session_id']}", headers=student)
            assert recovered.status_code == 200, recovered.text
            assert recovered.json()["session_id"] == snapshot["session_id"]
            assert recovered.json()["expires_at"] == snapshot["expires_at"]
            assert recovered.json()["content"] == snapshot["content"]
            assert client.get(f"/api/exercises/qa-session-{name}/sessions/{snapshot['session_id']}", headers=other_student).status_code == 404

        form_weight = client.post(f"/api/exercises/qa-session-form/sessions/{form_id}/actions", headers=student, json={"action": "form_table_weight", "row_id": noun_id, "direction": "up"})
        assert form_weight.status_code == 200, form_weight.text
        assert form_weight.json()["revision"] == 2
        assert form_weight.json()["progress"]["rows"][str(noun_id)]["weight"] == 1

        form_action = {"action": "form_table_check", "row_id": noun_id, "column_key": "dopełniacz", "answer": "kota-session-qa", "expected_attempts_used": 0}
        form_checked = client.post(f"/api/exercises/qa-session-form/sessions/{form_id}/actions", headers=student, json=form_action)
        assert form_checked.status_code == 200, form_checked.text
        assert form_checked.json()["revision"] == 3
        assert form_checked.json()["progress"]["cells"][f"{noun_id}:dopełniacz"]["status"] == "correct"
        form_replayed = client.post(f"/api/exercises/qa-session-form/sessions/{form_id}/actions", headers=student, json=form_action)
        assert form_replayed.status_code == 200
        assert form_replayed.json()["revision"] == 3
        with test_engine.connect() as connection:
            stat = connection.execute(text(
                "SELECT attempts, correct, weight, last_correct FROM word_test_stats WHERE word_type = 'noun' AND word_id = :id"
            ), {"id": noun_id}).one()
        assert stat == (1, 1, 1, True)

        single_id = sessions["single"]["session_id"]
        single_action = {"action": "single_input_check", "item_id": numerator_id, "answer": "not-one", "expected_attempts_used": 0}
        single_checked = client.post(f"/api/exercises/qa-session-single/sessions/{single_id}/actions", headers=student, json=single_action)
        assert single_checked.status_code == 200
        assert single_checked.json()["progress"]["items"][str(numerator_id)]["attempts_used"] == 1
        assert client.post(f"/api/exercises/qa-session-single/sessions/{single_id}/actions", headers=student, json=single_action).json()["revision"] == 2

        self_id = sessions["self"]["session_id"]
        assert client.post(f"/api/exercises/qa-session-self/sessions/{self_id}/actions", headers=student, json={"action": "self_check_reveal", "item_id": noun_id}).json()["revision"] == 2
        marked = client.post(f"/api/exercises/qa-session-self/sessions/{self_id}/actions", headers=student, json={"action": "self_check_mark", "item_id": noun_id, "result": "correct"})
        assert marked.status_code == 200
        assert marked.json()["progress"]["items"][str(noun_id)] == {"revealed": True, "result": "correct", "answer": "kota-session-qa"}

        fill_id = sessions["fill"]["session_id"]
        changed_definition = _fill_definition()
        changed_definition["items"][0]["parts"][1]["accepted_answers"] = ["changed-answer"]
        replacement = _exercise_payload("fill_blanks", changed_definition, slug="ignored", status="published")
        for key in ("slug", "type_code", "schema_version"):
            replacement.pop(key)
        assert client.put(f"/admin/exercises/{exercise_ids['fill']}", headers=admin, json=replacement).status_code == 200
        fill_checked = client.post(f"/api/exercises/qa-session-fill/sessions/{fill_id}/actions", headers=student, json={"action": "fill_blank_check", "blank_id": "blank-cat", "answer": "KOTA", "expected_attempts_used": 0})
        assert fill_checked.status_code == 200
        assert fill_checked.json()["progress"]["blanks"]["blank-cat"] == {"value": "KOTA", "attempts_used": 1, "status": "correct", "last_check": "correct"}
        assert client.post(f"/api/exercises/qa-session-fill/sessions/{fill_id}/actions", headers=student, json={"action": "self_check_reveal", "item_id": noun_id}).status_code == 409

        with test_engine.connect() as connection:
            after_actions = dict(connection.execute(text(
                "SELECT public_id, expires_at FROM exercise_sessions WHERE public_id = ANY(:ids)"
            ), {"ids": [snapshot["session_id"] for snapshot in sessions.values()]}).all())
        assert after_actions == {snapshot["session_id"]: datetime.fromisoformat(snapshot["expires_at"]) for snapshot in sessions.values()}
        for bad_id in ("not-a-valid-session", sessions["fill"]["session_id"]):
            assert client.get(f"/api/exercises/qa-session-form/sessions/{bad_id}", headers=student).status_code == 404

        ttl_id = client.post("/api/exercises/qa-session-fill/sessions", headers=student).json()["session_id"]
        just_before = datetime.now(timezone.utc) - timedelta(hours=24) + timedelta(seconds=5)
        with test_engine.begin() as connection:
            connection.execute(text("UPDATE exercise_sessions SET created_at = :created, expires_at = :created + INTERVAL '24 hours' WHERE public_id = :id"), {"created": just_before, "id": ttl_id})
        assert client.get(f"/api/exercises/qa-session-fill/sessions/{ttl_id}", headers=student).status_code == 200
        expired = datetime.now(timezone.utc) - timedelta(hours=24, seconds=5)
        with test_engine.begin() as connection:
            connection.execute(text("UPDATE exercise_sessions SET created_at = :created, expires_at = :created + INTERVAL '24 hours' WHERE public_id = :id"), {"created": expired, "id": ttl_id})
        assert client.get(f"/api/exercises/qa-session-fill/sessions/{ttl_id}", headers=student).status_code == 404
        with test_engine.connect() as connection:
            assert connection.execute(text("SELECT count(*) FROM exercise_sessions WHERE public_id = :id"), {"id": ttl_id}).scalar_one() == 0


def test_restart_replaces_the_session_without_leaking_progress(test_engine, test_database_url):
    """Restart drops an accessible attempt and creates a clean replacement."""
    upgrade_schema(test_database_url)
    from main import app
    with TestClient(app) as client:
        admin = _admin_headers(client, test_database_url)
        created = client.post("/admin/exercises", headers=admin, json=_exercise_payload("fill_blanks", _fill_definition(), slug="qa-restart", status="published"))
        assert created.status_code == 201
        student = _student_headers(client)
        original = client.post("/api/exercises/qa-restart/sessions", headers=student).json()
        original_id = original["session_id"]
        assert client.post(f"/api/exercises/qa-restart/sessions/{original_id}/actions", headers=student, json={"action": "fill_blank_check", "blank_id": "blank-cat", "answer": "wrong", "expected_attempts_used": 0}).status_code == 200
        fresh = client.post(f"/api/exercises/qa-restart/sessions/{original_id}/restart", headers=student)
        assert fresh.status_code == 200, fresh.text
        replacement = fresh.json()
        assert replacement["session_id"] != original_id
        assert replacement["revision"] == 1
        assert replacement["progress"]["blanks"]["blank-cat"] == {"value": None, "attempts_used": 0, "status": "open", "last_check": None}
        assert client.get(f"/api/exercises/qa-restart/sessions/{original_id}", headers=student).status_code == 404
        with test_engine.connect() as connection:
            assert connection.execute(text("SELECT count(*) FROM exercise_sessions WHERE public_id = :id"), {"id": original_id}).scalar_one() == 0

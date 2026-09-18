"""HTTP integration workflows against the isolated PostgreSQL test database."""
from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy import text

from helpers import authorization_header, create_admin, upgrade_schema

# Compatibility names keep the pre-existing scenarios compact.
_upgrade_schema = upgrade_schema
_create_admin = create_admin
_authorization_header = authorization_header


LEARNING_GET_ENDPOINTS = (
    "/api/exercises/",
    "/api/exercises/dopelniacz/pojed",
    "/api/exercises/dopelniacz/mnoga",
    "/api/exercises/numerators/",
    "/api/exercises/mianownik/mnoga",
    "/api/nouns/single",
    "/api/nouns/plural",
    "/api/pronouns/",
    "/api/verbs/",
    "/api/db-test",
    "/users/",
)


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


def test_administrator_is_limited_to_exercise_metadata_and_student_learning_flow_remains_available(
    test_engine, test_database_url
):
    """The CLI-created admin can only read metadata; a public learner keeps learning access."""
    _upgrade_schema(test_database_url)
    with test_engine.begin() as connection:
        noun_id = connection.execute(
            text(
                "INSERT INTO nouns (word, cases_pojed, cases_mnoga, cases_menska) "
                "VALUES (:word, CAST(:singular AS jsonb), CAST(:plural AS jsonb), "
                "CAST(:masculine AS jsonb)) RETURNING id"
            ),
            {
                "word": "kot-admin-qa",
                "singular": '{"mianownik": "kot-admin-qa"}',
                "plural": '{"mianownik": "koty-admin-qa"}',
                "masculine": '{"mianownik": "koty-admin-qa"}',
            },
        ).scalar_one()

    admin_username = "admin-workflow-qa"
    admin_email = "admin-workflow-qa@example.com"
    admin_password = "safe-admin-password-8"
    created = _create_admin(test_database_url, admin_username, admin_email, admin_password)
    assert created.returncode == 0, created.stderr
    assert "traceback" not in created.stderr.lower()
    assert "bcrypt" not in created.stderr.lower()

    with test_engine.connect() as connection:
        original_admin = connection.execute(
            text(
                "SELECT username, email, hashed_password, is_active, is_superuser "
                "FROM users WHERE username = :username"
            ),
            {"username": admin_username},
        ).mappings().one()
    assert original_admin["email"] == admin_email
    assert original_admin["is_active"] is True
    assert original_admin["is_superuser"] is True

    duplicate_username = _create_admin(
        test_database_url, admin_username, "another-admin-qa@example.com", admin_password
    )
    assert duplicate_username.returncode != 0
    assert "username" in duplicate_username.stderr.lower()
    duplicate_email = _create_admin(
        test_database_url, "another-admin-qa", admin_email, admin_password
    )
    assert duplicate_email.returncode != 0
    assert "email" in duplicate_email.stderr.lower()
    with test_engine.connect() as connection:
        unchanged_admin = connection.execute(
            text(
                "SELECT username, email, hashed_password, is_active, is_superuser "
                "FROM users WHERE username = :username"
            ),
            {"username": admin_username},
        ).mappings().one()
        assert connection.execute(text("SELECT count(*) FROM users")).scalar_one() == 1
    assert dict(unchanged_admin) == dict(original_admin)

    from main import app

    learner_payload = {
        "username": "learner-admin-qa",
        "email": "learner-admin-qa@example.com",
        "password": "safe-learner-password-8",
    }
    with TestClient(app) as client:
        unauthenticated_admin = client.get("/admin/exercises")
        assert unauthenticated_admin.status_code == 401, unauthenticated_admin.text

        admin_headers = _authorization_header(client, admin_username, admin_password)
        current_admin = client.get("/users/me", headers=admin_headers)
        assert current_admin.status_code == 200, current_admin.text
        assert current_admin.json()["is_active"] is True
        assert current_admin.json()["is_superuser"] is True

        admin_catalog = client.get("/admin/exercises", headers=admin_headers)
        assert admin_catalog.status_code == 200, admin_catalog.text
        assert admin_catalog.json()
        assert all(
            set(item) == {"id", "slug", "title", "type_code", "schema_version", "status", "display_order"}
            for item in admin_catalog.json()
        )

        for endpoint in LEARNING_GET_ENDPOINTS:
            no_token = client.get(endpoint)
            assert no_token.status_code == 401, (endpoint, no_token.text)
            denied = client.get(endpoint, headers=admin_headers)
            assert denied.status_code == 403, (endpoint, denied.text)

        for endpoint, payload in (
            ("/api/tests/attempt", {"word_type": "noun", "word_id": noun_id, "is_correct": True}),
            ("/api/tests/complete", {"word_type": "noun", "word_id": noun_id, "all_correct": True}),
            ("/api/tests/weight", {"word_type": "noun", "word_id": noun_id, "direction": "up"}),
        ):
            denied = client.post(endpoint, headers=admin_headers, json=payload)
            assert denied.status_code == 403, (endpoint, denied.text)

        registration = client.post("/users/register", json=learner_payload)
        assert registration.status_code == 200, registration.text
        registered_learner = registration.json()
        assert registered_learner["is_active"] is True
        assert registered_learner["is_superuser"] is False

        learner_headers = _authorization_header(
            client, learner_payload["username"], learner_payload["password"]
        )
        denied_admin_catalog = client.get("/admin/exercises", headers=learner_headers)
        assert denied_admin_catalog.status_code == 403, denied_admin_catalog.text

        learner_nouns = client.get("/api/nouns/single", headers=learner_headers)
        assert learner_nouns.status_code == 200, learner_nouns.text
        assert any(noun["id"] == noun_id for noun in learner_nouns.json())
        learner_attempt = client.post(
            "/api/tests/attempt",
            headers=learner_headers,
            json={"word_type": "noun", "word_id": noun_id, "is_correct": True},
        )
        assert learner_attempt.status_code == 200, learner_attempt.text
        learner_completion = client.post(
            "/api/tests/complete",
            headers=learner_headers,
            json={"word_type": "noun", "word_id": noun_id, "all_correct": True},
        )
        assert learner_completion.status_code == 200, learner_completion.text

    with test_engine.connect() as connection:
        admin_progress_count = connection.execute(
            text("SELECT count(*) FROM word_test_stats WHERE user_id = :user_id"),
            {"user_id": current_admin.json()["id"]},
        ).scalar_one()
        learner_progress = connection.execute(
            text(
                "SELECT attempts, correct, last_correct FROM word_test_stats "
                "WHERE user_id = :user_id AND word_type = 'noun' AND word_id = :word_id"
            ),
            {"user_id": registered_learner["id"], "word_id": noun_id},
        ).mappings().one()
    assert admin_progress_count == 0
    assert dict(learner_progress) == {"attempts": 1, "correct": 1, "last_correct": True}


def test_administrator_catalog_returns_an_explicit_empty_list_for_an_empty_catalog(
    test_engine, test_database_url
):
    """The metadata API exposes an empty catalog as an empty list, without learner data."""
    _upgrade_schema(test_database_url)
    created = _create_admin(
        test_database_url,
        "empty-catalog-admin-qa",
        "empty-catalog-admin-qa@example.com",
        "safe-admin-password-8",
    )
    assert created.returncode == 0, created.stderr
    assert "traceback" not in created.stderr.lower()
    assert "bcrypt" not in created.stderr.lower()

    with test_engine.begin() as connection:
        connection.execute(text("DELETE FROM exercises"))

    from main import app
    with TestClient(app) as client:
        headers = _authorization_header(client, "empty-catalog-admin-qa", "safe-admin-password-8")
        catalog = client.get("/admin/exercises", headers=headers)
    assert catalog.status_code == 200, catalog.text
    assert catalog.json() == []


def test_administrator_manages_a_rule_forest_atomically(test_engine, test_database_url):
    """Administrative rule CRUD preserves the complete hierarchy on PostgreSQL."""
    _upgrade_schema(test_database_url)
    admin_username = "rules-admin-qa"
    admin_password = "safe-admin-password-8"
    created = _create_admin(
        test_database_url,
        admin_username,
        "rules-admin-qa@example.com",
        admin_password,
    )
    assert created.returncode == 0, created.stderr

    from main import app

    def create_rule(client, headers, title, description, parent_rule_id=None):
        response = client.post(
            "/admin/rules",
            headers=headers,
            json={
                "title": title,
                "description": description,
                "parent_rule_id": parent_rule_id,
            },
        )
        assert response.status_code == 201, response.text
        return response.json()

    with TestClient(app) as client:
        unauthenticated_requests = (
            ("get", "/admin/rules", {}),
            ("post", "/admin/rules", {"json": {"title": "Rule", "description": "Description"}}),
            ("put", "/admin/rules/999", {"json": {"title": "Rule", "description": "Description", "parent_rule_id": None}}),
            ("delete", "/admin/rules/999", {}),
        )
        for method, url, kwargs in unauthenticated_requests:
            response = getattr(client, method)(url, **kwargs)
            assert response.status_code == 401, (method, response.text)

        learner_payload = {
            "username": "rules-learner-qa",
            "email": "rules-learner-qa@example.com",
            "password": "safe-learner-password-8",
        }
        registration = client.post("/users/register", json=learner_payload)
        assert registration.status_code == 200, registration.text
        learner_headers = _authorization_header(
            client, learner_payload["username"], learner_payload["password"]
        )
        for method, url, kwargs in unauthenticated_requests:
            response = getattr(client, method)(url, headers=learner_headers, **kwargs)
            assert response.status_code == 403, (method, response.text)

        admin_headers = _authorization_header(client, admin_username, admin_password)
        invalid = client.post(
            "/admin/rules",
            headers=admin_headers,
            json={"title": "   ", "description": " Description ", "parent_rule_id": None},
        )
        assert invalid.status_code == 422, invalid.text
        assert client.get("/admin/rules", headers=admin_headers).json() == []

        root_a = create_rule(client, admin_headers, " Root A ", " Description A ")
        assert root_a["title"] == "Root A"
        assert root_a["description"] == "Description A"
        root_b = create_rule(client, admin_headers, "Root B", "Description B")
        middle = create_rule(client, admin_headers, "Middle", "Description middle", root_a["id"])
        leaf = create_rule(client, admin_headers, "Leaf", "Description leaf", middle["id"])
        grandchild = create_rule(client, admin_headers, "Grandchild", "Description grandchild", leaf["id"])
        sibling = create_rule(client, admin_headers, "Sibling", "Description sibling", root_a["id"])
        movable = create_rule(client, admin_headers, "Movable", "Description movable", root_a["id"])
        branch_b = create_rule(client, admin_headers, "Branch B", "Description branch B", root_b["id"])

        forest = client.get("/admin/rules", headers=admin_headers)
        assert forest.status_code == 200, forest.text
        assert [node["title"] for node in forest.json()] == ["Root A", "Root B"]
        assert [node["title"] for node in forest.json()[0]["children"]] == ["Middle", "Sibling", "Movable"]
        assert forest.json()[0]["children"][0]["children"][0]["children"][0]["id"] == grandchild["id"]

        changed_sibling = client.put(
            f"/admin/rules/{sibling['id']}",
            headers=admin_headers,
            json={"title": "Sibling changed", "description": "Changed description", "parent_rule_id": root_a["id"]},
        )
        assert changed_sibling.status_code == 200, changed_sibling.text
        assert changed_sibling.json()["description"] == "Changed description"

        moved = client.put(
            f"/admin/rules/{movable['id']}",
            headers=admin_headers,
            json={"title": "Movable", "description": "Description movable", "parent_rule_id": branch_b["id"]},
        )
        assert moved.status_code == 200, moved.text
        assert moved.json()["parent_rule_id"] == branch_b["id"]
        made_root = client.put(
            f"/admin/rules/{movable['id']}",
            headers=admin_headers,
            json={"title": "Movable", "description": "Description movable", "parent_rule_id": None},
        )
        assert made_root.status_code == 200, made_root.text
        assert made_root.json()["parent_rule_id"] is None

        before_rejected_changes = client.get("/admin/rules", headers=admin_headers).json()
        rejected_requests = (
            ("post", "/admin/rules", {"title": "Missing parent", "description": "Description", "parent_rule_id": 99999}, 404),
            ("put", "/admin/rules/99999", {"title": "Missing", "description": "Description", "parent_rule_id": None}, 404),
            ("delete", "/admin/rules/99999", None, 404),
            ("put", f"/admin/rules/{middle['id']}", {"title": "Middle", "description": "Description middle", "parent_rule_id": middle["id"]}, 409),
            ("put", f"/admin/rules/{middle['id']}", {"title": "Middle", "description": "Description middle", "parent_rule_id": grandchild["id"]}, 409),
        )
        for method, url, payload, expected_status in rejected_requests:
            kwargs = {"headers": admin_headers}
            if payload is not None:
                kwargs["json"] = payload
            rejected = getattr(client, method)(url, **kwargs)
            assert rejected.status_code == expected_status, rejected.text
            assert client.get("/admin/rules", headers=admin_headers).json() == before_rejected_changes

        deleted_middle = client.delete(f"/admin/rules/{middle['id']}", headers=admin_headers)
        assert deleted_middle.status_code == 204, deleted_middle.text
        after_middle_delete = client.get("/admin/rules", headers=admin_headers).json()
        root_a_after_middle_delete = next(node for node in after_middle_delete if node["id"] == root_a["id"])
        leaf_after_middle_delete = next(node for node in root_a_after_middle_delete["children"] if node["id"] == leaf["id"])
        assert leaf_after_middle_delete["parent_rule_id"] == root_a["id"]
        assert leaf_after_middle_delete["children"][0]["id"] == grandchild["id"]
        assert leaf_after_middle_delete["children"][0]["parent_rule_id"] == leaf["id"]

        deleted_root = client.delete(f"/admin/rules/{root_a['id']}", headers=admin_headers)
        assert deleted_root.status_code == 204, deleted_root.text
        after_root_delete = client.get("/admin/rules", headers=admin_headers).json()
        promoted_leaf = next(node for node in after_root_delete if node["id"] == leaf["id"])
        assert promoted_leaf["parent_rule_id"] is None
        assert promoted_leaf["children"][0]["id"] == grandchild["id"]
        assert promoted_leaf["children"][0]["parent_rule_id"] == leaf["id"]

        atomic_parent = create_rule(client, admin_headers, "Atomic parent", "Atomic parent description")
        atomic_child = create_rule(
            client, admin_headers, "Atomic child", "Atomic child description", atomic_parent["id"]
        )
        before_atomic_delete = client.get("/admin/rules", headers=admin_headers).json()
        with test_engine.begin() as connection:
            connection.execute(
                text(
                    "CREATE FUNCTION reject_rule_delete_for_qa() RETURNS trigger AS $$ "
                    "BEGIN RAISE EXCEPTION 'reject rule deletion for QA'; END; $$ LANGUAGE plpgsql"
                )
            )
            connection.execute(
                text(
                    "CREATE TRIGGER reject_rule_delete_for_qa BEFORE DELETE ON rules "
                    "FOR EACH ROW WHEN (OLD.id = :rule_id) "
                    "EXECUTE FUNCTION reject_rule_delete_for_qa()"
                ),
                {"rule_id": atomic_parent["id"]},
            )
        rejected_delete = client.delete(f"/admin/rules/{atomic_parent['id']}", headers=admin_headers)
        assert rejected_delete.status_code == 500, rejected_delete.text
        assert client.get("/admin/rules", headers=admin_headers).json() == before_atomic_delete
        with test_engine.connect() as connection:
            atomic_rows = connection.execute(
                text("SELECT id, parent_rule_id FROM rules WHERE id IN (:parent_id, :child_id) ORDER BY id"),
                {"parent_id": atomic_parent["id"], "child_id": atomic_child["id"]},
            ).mappings().all()
        assert [dict(row) for row in atomic_rows] == [
            {"id": atomic_parent["id"], "parent_rule_id": None},
            {"id": atomic_child["id"], "parent_rule_id": atomic_parent["id"]},
        ]

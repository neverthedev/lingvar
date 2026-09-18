"""Shared helpers for PostgreSQL-backed HTTP integration scenarios."""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

from fastapi.testclient import TestClient


BACKEND_DIRECTORY = Path(__file__).resolve().parents[1]


def upgrade_schema(database_url: str) -> None:
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


def create_admin(
    database_url: str, username: str, email: str, password: str
) -> subprocess.CompletedProcess[str]:
    environment = os.environ.copy()
    environment["DATABASE_URL"] = database_url
    return subprocess.run(
        [
            sys.executable,
            "-m",
            "create_admin",
            "--username",
            username,
            "--email",
            email,
            "--password-stdin",
        ],
        cwd=BACKEND_DIRECTORY,
        env=environment,
        input=f"{password}\n",
        text=True,
        capture_output=True,
        check=False,
    )


def authorization_header(client: TestClient, username: str, password: str) -> dict[str, str]:
    token = client.post("/users/token", data={"username": username, "password": password})
    assert token.status_code == 200, token.text
    return {"Authorization": f"Bearer {token.json()['access_token']}"}

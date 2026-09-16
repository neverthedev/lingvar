"""Create one active administrative user through an explicit CLI command."""
from __future__ import annotations

import argparse
import getpass
import sys

from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError

from models.user import User, UserCreate
from services import migrations
from services.auth import get_password_hash
from services.database import SessionLocal


def _read_password(from_stdin: bool) -> str:
    if from_stdin:
        return sys.stdin.readline().rstrip("\r\n")

    password = getpass.getpass("Password: ")
    confirmation = getpass.getpass("Confirm password: ")
    if password != confirmation:
        raise ValueError("Passwords do not match.")
    return password


def main() -> int:
    parser = argparse.ArgumentParser(description="Create an active Lingvar administrator")
    parser.add_argument("--username", required=True)
    parser.add_argument("--email", required=True)
    parser.add_argument(
        "--password-stdin",
        action="store_true",
        help="Read one password from standard input without echoing it.",
    )
    args = parser.parse_args()

    try:
        password = _read_password(args.password_stdin)
        user_data = UserCreate(username=args.username, email=args.email, password=password)
        migrations.check()
    except (ValueError, ValidationError) as error:
        print(f"Cannot create administrator: {error}", file=sys.stderr)
        return 1
    except Exception as error:
        print(f"Migration check failed: {error}", file=sys.stderr)
        return 1

    db = SessionLocal()
    try:
        username_taken = db.query(User.id).filter(User.username == user_data.username).first()
        if username_taken:
            print("Cannot create administrator: username is already in use.", file=sys.stderr)
            return 1

        email_taken = db.query(User.id).filter(User.email == user_data.email).first()
        if email_taken:
            print("Cannot create administrator: email is already in use.", file=sys.stderr)
            return 1

        admin = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=get_password_hash(user_data.password),
            is_active=True,
            is_superuser=True,
        )
        db.add(admin)
        db.commit()
        print(f"Administrator '{admin.username}' created.")
        return 0
    except IntegrityError:
        db.rollback()
        print("Cannot create administrator: username or email is already in use.", file=sys.stderr)
        return 1
    except Exception as error:
        db.rollback()
        print(f"Cannot create administrator: {error}", file=sys.stderr)
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())

"""Public exercise-session identifiers and immutable 24-hour expiry."""
from alembic import op
import base64
import os
import sqlalchemy as sa


revision = "0003_exercise_session_public_id"
down_revision = "0002_exercise_types"
branch_labels = None
depends_on = None


def _public_id() -> str:
    return base64.urlsafe_b64encode(os.urandom(16)).rstrip(b"=").decode("ascii")


def upgrade():
    op.add_column("exercise_sessions", sa.Column("public_id", sa.String(length=22), nullable=True))
    op.add_column("exercise_sessions", sa.Column("revision", sa.Integer(), nullable=False, server_default="1"))
    op.create_unique_constraint("uq_exercise_sessions_public_id", "exercise_sessions", ["public_id"])

    connection = op.get_bind()
    rows = connection.execute(sa.text("SELECT id FROM exercise_sessions WHERE public_id IS NULL")).scalars().all()
    for session_id in rows:
        connection.execute(
            sa.text("UPDATE exercise_sessions SET public_id = :public_id WHERE id = :id"),
            {"public_id": _public_id(), "id": session_id},
        )

    connection.execute(sa.text("UPDATE exercise_sessions SET expires_at = created_at + INTERVAL '24 hours'"))
    op.alter_column("exercise_sessions", "public_id", nullable=False)
    op.create_check_constraint(
        "ck_exercise_sessions_fixed_ttl",
        "exercise_sessions",
        "expires_at = created_at + INTERVAL '24 hours'",
    )
    op.create_check_constraint(
        "ck_exercise_sessions_public_id_length",
        "exercise_sessions",
        "char_length(public_id) = 22",
    )


def downgrade():
    raise RuntimeError("Downgrade of exercise session public identifiers is not supported.")

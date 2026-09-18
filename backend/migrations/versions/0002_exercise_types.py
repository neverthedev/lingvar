"""Exercise catalogue and short-lived server sessions.

This revision is deliberately self-contained: the backfill must remain valid
without importing the application's ORM or validation registry.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0002_exercise_types"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


CASES = [
    {"key": "dopełniacz", "label": "Dopełniacz"}, {"key": "celownik", "label": "Celownik"},
    {"key": "biernik", "label": "Biernik"}, {"key": "narzędnik", "label": "Narzędnik"},
    {"key": "miejscownik", "label": "Miejscownik"}, {"key": "wołacz", "label": "Wołacz"},
]
VERB_COLUMNS = [
    {"key": "ja", "label": "Ja"}, {"key": "ono", "label": "On/Ona/Ono"}, {"key": "ty", "label": "Ty"},
    {"key": "my", "label": "My"}, {"key": "wy", "label": "Wy"}, {"key": "one", "label": "Oni/One"},
]


def upgrade():
    op.create_table(
        "exercises",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("slug", sa.String(length=100), nullable=False),
        sa.Column("type_code", sa.String(length=50), nullable=False),
        sa.Column("schema_version", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("instruction", sa.Text(), nullable=False),
        sa.Column("difficulty", sa.String(length=20), nullable=False),
        sa.Column("estimated_duration_minutes", sa.Integer(), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("definition", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("status IN ('draft', 'published')", name="ck_exercises_status"),
        sa.CheckConstraint("schema_version > 0", name="ck_exercises_schema_version"),
        sa.CheckConstraint("display_order >= 0", name="ck_exercises_display_order"),
        sa.CheckConstraint("estimated_duration_minutes IS NULL OR estimated_duration_minutes > 0", name="ck_exercises_duration"),
    )
    op.create_index("ix_exercises_slug", "exercises", ["slug"], unique=True)
    op.create_index("ix_exercises_catalog", "exercises", ["status", "display_order", "id"])
    op.create_table(
        "exercise_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("exercise_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("state", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["exercise_id"], ["exercises.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_exercise_sessions_expires_at", "exercise_sessions", ["expires_at"])
    op.create_index("ix_exercise_sessions_user_exercise", "exercise_sessions", ["user_id", "exercise_id"])

    exercises = sa.table(
        "exercises", sa.column("slug"), sa.column("type_code"), sa.column("schema_version"), sa.column("title"),
        sa.column("description"), sa.column("instruction"), sa.column("difficulty"), sa.column("estimated_duration_minutes"),
        sa.column("display_order"), sa.column("status"), sa.column("definition", postgresql.JSONB()),
    )
    op.bulk_insert(exercises, [
        {"slug": "singular-nouns", "type_code": "form_table", "schema_version": 1, "title": "Singular Nouns", "description": "Practice identifying and using singular nouns in different contexts. Learn the basics of noun usage.", "instruction": "Click on any case cell to fill in the correct form. You have 3 attempts per cell.", "difficulty": "beginner", "estimated_duration_minutes": 15, "display_order": 0, "status": "published", "definition": {"source_code": "nouns_singular_cases", "columns": CASES, "sample_size": 20, "max_attempts": 3}},
        {"slug": "pronouns", "type_code": "form_table", "schema_version": 1, "title": "Pronouns", "description": "Learn about different types of pronouns and their usage in sentences.", "instruction": "Click on any case cell to fill in the correct form. You have 3 attempts per cell.", "difficulty": "beginner", "estimated_duration_minutes": 20, "display_order": 1, "status": "published", "definition": {"source_code": "pronouns_cases", "columns": CASES, "sample_size": None, "max_attempts": 3}},
        {"slug": "verbs", "type_code": "form_table", "schema_version": 1, "title": "Verbs", "description": "Master Polish verb conjugation across different personal pronouns and practice with various examples.", "instruction": "Click on any conjugation cell to fill in the correct form. You have 3 attempts per cell.", "difficulty": "intermediate", "estimated_duration_minutes": 25, "display_order": 2, "status": "published", "definition": {"source_code": "verbs_present_cases", "columns": VERB_COLUMNS, "sample_size": 20, "max_attempts": 3}},
        {"slug": "dopelniacz-pojed", "type_code": "self_check", "schema_version": 1, "title": "Dopełniacz (Genitive Case) Liczby Pojedynczej", "description": "Practice identifying and using singular nouns in different contexts. Learn the basics of noun usage.", "instruction": "Recall the answer, reveal it, then mark your result.", "difficulty": "beginner", "estimated_duration_minutes": 15, "display_order": 3, "status": "published", "definition": {"source_code": "nouns_singular_genitive", "sample_size": 50}},
        {"slug": "dopelniacz-mnoga", "type_code": "self_check", "schema_version": 1, "title": "Dopełniacz (Genitive Case) Liczby Mnogiej", "description": "Practice identifying and using plural nouns in different contexts. Learn the basics of noun usage.", "instruction": "Recall the answer, reveal it, then mark your result.", "difficulty": "beginner", "estimated_duration_minutes": 15, "display_order": 4, "status": "published", "definition": {"source_code": "nouns_plural_genitive", "sample_size": 50}},
        {"slug": "numerators", "type_code": "single_input", "schema_version": 1, "title": "Liczebniki (Numerals)", "description": "Practice Polish numerals and their Russian translations. Learn different forms of numbers.", "instruction": "Enter the Polish form. You have three attempts per item.", "difficulty": "beginner", "estimated_duration_minutes": 10, "display_order": 5, "status": "published", "definition": {"source_code": "numerators_translation_to_word", "sample_size": 20, "max_attempts": 3, "reveal_after_exhaustion": True}},
        {"slug": "mianowniki-mnoga", "type_code": "single_input", "schema_version": 1, "title": "Mianownik Liczny Mnogej", "description": "Practice Polish nouns in nominative plural case with their Russian translations. Learn different forms of plural nouns.", "instruction": "Enter the plural nominative form. You have three attempts per item.", "difficulty": "beginner", "estimated_duration_minutes": 10, "display_order": 6, "status": "published", "definition": {"source_code": "nouns_singular_to_plural_nominative", "sample_size": 50, "max_attempts": 3, "reveal_after_exhaustion": True}},
    ])


def downgrade():
    raise RuntimeError("Downgrade of exercise types is forbidden: it could delete administrator content.")

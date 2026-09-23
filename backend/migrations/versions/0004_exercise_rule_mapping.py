"""Require one rule for every exercise and preserve existing assignments."""
from alembic import op
import sqlalchemy as sa


revision = "0004_exercise_rule_mapping"
down_revision = "0003_exercise_session_public_id"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("exercises", sa.Column("rule_id", sa.Integer(), nullable=True))
    connection = op.get_bind()
    exercise_count = connection.execute(sa.text("SELECT count(*) FROM exercises WHERE rule_id IS NULL")).scalar_one()
    if exercise_count:
        next_ordering = connection.execute(
            sa.text("SELECT coalesce(max(ordering), -1) + 1 FROM rules WHERE parent_rule_id IS NULL")
        ).scalar_one()
        rule_id = connection.execute(
            sa.text(
                "INSERT INTO rules (title, description, parent_rule_id, ordering) "
                "VALUES (:title, :description, NULL, :ordering) RETURNING id"
            ),
            {
                "title": "Правила польского языка",
                "description": "Общее правило для упражнений, созданных до назначения отдельных правил.",
                "ordering": next_ordering,
            },
        ).scalar_one()
        connection.execute(sa.text("UPDATE exercises SET rule_id = :rule_id WHERE rule_id IS NULL"), {"rule_id": rule_id})
    op.create_foreign_key("fk_exercises_rule_id_rules", "exercises", "rules", ["rule_id"], ["id"], ondelete="RESTRICT")
    op.create_index("ix_exercises_rule_id", "exercises", ["rule_id"])
    op.alter_column("exercises", "rule_id", nullable=False)


def downgrade():
    raise RuntimeError("Downgrade of exercise rule assignments is not supported.")

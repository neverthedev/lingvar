import uuid

from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.sql import func

from services.base import Base


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True)
    slug = Column(String(100), nullable=False, unique=True)
    type_code = Column(String(50), nullable=False)
    schema_version = Column(Integer, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False, default="")
    instruction = Column(Text, nullable=False)
    difficulty = Column(String(20), nullable=False)
    estimated_duration_minutes = Column(Integer, nullable=True)
    display_order = Column(Integer, nullable=False, default=0)
    status = Column(String(20), nullable=False, default="draft")
    rule_id = Column(Integer, ForeignKey("rules.id", ondelete="RESTRICT"), nullable=False, index=True)
    definition = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("status IN ('draft', 'published')", name="ck_exercises_status"),
        CheckConstraint("schema_version > 0", name="ck_exercises_schema_version"),
        CheckConstraint("display_order >= 0", name="ck_exercises_display_order"),
        CheckConstraint(
            "estimated_duration_minutes IS NULL OR estimated_duration_minutes > 0",
            name="ck_exercises_duration",
        ),
        Index("ix_exercises_catalog", "status", "display_order", "id"),
    )


class ExerciseSession(Base):
    __tablename__ = "exercise_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    public_id = Column(String(22), nullable=False, unique=True)
    exercise_id = Column(Integer, ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    state = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revision = Column(Integer, nullable=False, default=1)

    __table_args__ = (
        CheckConstraint("char_length(public_id) = 22", name="ck_exercise_sessions_public_id_length"),
        CheckConstraint(
            "expires_at = created_at + INTERVAL '24 hours'",
            name="ck_exercise_sessions_fixed_ttl",
        ),
        Index("ix_exercise_sessions_expires_at", "expires_at"),
        Index("ix_exercise_sessions_user_exercise", "user_id", "exercise_id"),
    )

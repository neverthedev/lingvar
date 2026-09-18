"""Compatibility helpers for legacy exercise endpoint wrappers."""

from sqlalchemy.orm import Session

from models.exercise import Exercise
from services.exercises import load_content


def legacy_content(db: Session, slug: str, user_id: int) -> dict:
    exercise = db.query(Exercise).filter(Exercise.slug == slug, Exercise.status == "published").first()
    return load_content(db, exercise, user_id) if exercise is not None else {}

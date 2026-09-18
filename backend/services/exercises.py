"""Exercise type and vocabulary-source registries.

The registries are the one place where a code-supported exercise type or a
named read-only vocabulary query is declared. Database records select only
from these entries; they cannot describe arbitrary tables or SQL.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Callable
from uuid import UUID, uuid4

from fastapi import HTTPException
from pydantic import BaseModel, TypeAdapter, ValidationError
from sqlalchemy import Float, case, cast, delete, func, text
from sqlalchemy.orm import Session

from models.exercise import Exercise, ExerciseSession
from models.vocabulary import Noun, Numerator, Pronoun, Verb, WordTestStat
from schemas.exercises import (
    BlankPart,
    FillBlanksDefinition,
    FormTableDefinition,
    LearnerExerciseResponse,
    SelfCheckDefinition,
    SingleInputDefinition,
)


DefinitionModel = type[BaseModel]
ContentSerializer = Callable[[Session, dict[str, Any], int], dict[str, Any]]


@dataclass(frozen=True)
class ExerciseTypeHandler:
    label: str
    definition_model: DefinitionModel
    learner_serializer: ContentSerializer
    session_creator: Callable[[Session, Exercise, int], ExerciseSession] | None = None
    blank_checker: Callable[[Session, ExerciseSession, str, str], list[dict[str, Any]]] | None = None


@dataclass(frozen=True)
class VocabularySourceHandler:
    type_code: str
    learner_serializer: ContentSerializer
    allowed_columns: frozenset[str] = frozenset()


def _issue(loc: list[str | int], message: str, issue_type: str = "value_error") -> dict[str, Any]:
    return {"loc": ["body", *loc], "msg": message, "type": issue_type}


def _validation_error(loc: list[str | int], message: str) -> HTTPException:
    return HTTPException(status_code=422, detail=[_issue(loc, message)])


def _sample(query, size: int | None):
    if size is None:
        return query.all()
    return query.order_by(func.random()).limit(size).all()


def load_nouns_singular_cases(db: Session, definition: dict[str, Any], _user_id: int) -> dict[str, Any]:
    columns = definition["columns"]
    rows = _sample(db.query(Noun), definition["sample_size"])
    return {
        "columns": columns,
        "max_attempts": definition["max_attempts"],
        "statistics_word_type": "noun",
        "rows": [
            {"id": noun.id, "prompt": noun.word, "answers": {column["key"]: noun.cases_pojed.get(column["key"], "") for column in columns}}
            for noun in rows
        ],
    }


def load_pronouns_cases(db: Session, definition: dict[str, Any], _user_id: int) -> dict[str, Any]:
    columns = definition["columns"]
    rows = _sample(db.query(Pronoun).order_by(Pronoun.id), definition["sample_size"])
    return {
        "columns": columns,
        "max_attempts": definition["max_attempts"],
        "statistics_word_type": "pronoun",
        "rows": [
            {"id": row.id, "prompt": row.word, "answers": {column["key"]: row.cases.get(column["key"], "") for column in columns}}
            for row in rows
        ],
    }


def load_verbs_present_cases(db: Session, definition: dict[str, Any], user_id: int) -> dict[str, Any]:
    columns = definition["columns"]
    attempts = func.coalesce(WordTestStat.attempts, 0)
    correct = func.coalesce(WordTestStat.correct, 0)
    accuracy = func.coalesce(cast(correct, Float) / func.nullif(cast(attempts, Float), 0), 0.0)
    need = 1.0 - accuracy
    last_tested = func.coalesce(WordTestStat.last_tested_at, func.now() - text("interval '365 days'"))
    days_since = func.extract("epoch", func.now() - last_tested) / 86400.0
    recency = func.least(days_since / 30.0, 1.0)
    unseen = case((attempts == 0, 1.0), else_=0.0)
    manual_weight = func.coalesce(WordTestStat.weight, 0)
    weight_norm = cast(manual_weight, Float) / 5.0
    score = (0.5 * need) + (0.35 * recency) + (0.15 * unseen) + (0.2 * weight_norm)
    query = db.query(Verb, WordTestStat.weight).outerjoin(
        WordTestStat,
        (WordTestStat.word_id == Verb.id)
        & (WordTestStat.word_type == "verb")
        & (WordTestStat.user_id == user_id),
    ).order_by(score.desc(), func.random())
    if definition["sample_size"] is not None:
        query = query.limit(definition["sample_size"])
    rows = query.all()
    return {
        "columns": columns,
        "max_attempts": definition["max_attempts"],
        "statistics_word_type": "verb",
        "rows": [
            {
                "id": row.id,
                "prompt": row.word,
                "answers": {column["key"]: row.cases.get(column["key"], "") for column in columns},
                "weight": weight or 0,
            }
            for row, weight in rows
        ],
    }


def load_nouns_singular_genitive(db: Session, definition: dict[str, Any], _user_id: int) -> dict[str, Any]:
    rows = _sample(db.query(Noun), definition["sample_size"])
    return {"items": [{"id": row.id, "prompt": row.word, "answer": row.cases_pojed.get("dopełniacz", "")} for row in rows]}


def load_nouns_plural_genitive(db: Session, definition: dict[str, Any], _user_id: int) -> dict[str, Any]:
    rows = _sample(db.query(Noun), definition["sample_size"])
    return {"items": [{"id": row.id, "prompt": row.word, "answer": row.cases_mnoga.get("dopełniacz", "")} for row in rows]}


def load_numerators_translation_to_word(db: Session, definition: dict[str, Any], _user_id: int) -> dict[str, Any]:
    rows = _sample(db.query(Numerator), definition["sample_size"])
    return {
        "max_attempts": definition["max_attempts"],
        "reveal_after_exhaustion": definition["reveal_after_exhaustion"],
        "items": [{"id": row.id, "prompt": row.translation, "answer": row.word} for row in rows],
    }


def load_nouns_singular_to_plural_nominative(db: Session, definition: dict[str, Any], _user_id: int) -> dict[str, Any]:
    rows = _sample(db.query(Noun), definition["sample_size"])
    return {
        "max_attempts": definition["max_attempts"],
        "reveal_after_exhaustion": definition["reveal_after_exhaustion"],
        "items": [{"id": row.id, "prompt": row.word, "answer": row.cases_mnoga.get("mianownik", "")} for row in rows],
    }


SOURCE_REGISTRY: dict[str, VocabularySourceHandler] = {
    "nouns_singular_cases": VocabularySourceHandler("form_table", load_nouns_singular_cases, frozenset({"mianownik", "dopełniacz", "celownik", "biernik", "narzędnik", "miejscownik", "wołacz"})),
    "pronouns_cases": VocabularySourceHandler("form_table", load_pronouns_cases, frozenset({"mianownik", "dopełniacz", "celownik", "biernik", "narzędnik", "miejscownik", "wołacz"})),
    "verbs_present_cases": VocabularySourceHandler("form_table", load_verbs_present_cases, frozenset({"ja", "ty", "ono", "my", "wy", "one"})),
    "nouns_singular_genitive": VocabularySourceHandler("self_check", load_nouns_singular_genitive),
    "nouns_plural_genitive": VocabularySourceHandler("self_check", load_nouns_plural_genitive),
    "numerators_translation_to_word": VocabularySourceHandler("single_input", load_numerators_translation_to_word),
    "nouns_singular_to_plural_nominative": VocabularySourceHandler("single_input", load_nouns_singular_to_plural_nominative),
}


def _serialize_vocabulary_source(db: Session, definition: dict[str, Any], user_id: int) -> dict[str, Any]:
    return SOURCE_REGISTRY[definition["source_code"]].learner_serializer(db, definition, user_id)


def _serialize_fill_blanks(_db: Session, definition: dict[str, Any], _user_id: int) -> dict[str, Any]:
    return {
        "items": [
            {
                "id": item["id"],
                "parts": [
                    {"kind": "blank", "id": part["id"], "hint": part.get("hint")}
                    if part["kind"] == "blank"
                    else part
                    for part in item["parts"]
                ],
            }
            for item in definition["items"]
        ]
    }


def _safe_states(state: dict[str, Any]) -> list[dict[str, Any]]:
    result = []
    for blank_id, blank in state["blanks"].items():
        item = {key: blank.get(key) for key in ("value", "attempts_used", "status", "last_check")}
        item["id"] = blank_id
        if blank["status"] == "exhausted":
            item["revealed_answers"] = blank["accepted_answers"]
        result.append(item)
    return result


def _create_fill_blanks_session(db: Session, exercise: Exercise, user_id: int) -> ExerciseSession:
    definition = FillBlanksDefinition.model_validate(exercise.definition)
    now = datetime.now(timezone.utc)
    db.execute(delete(ExerciseSession).where(ExerciseSession.expires_at <= now))
    blanks = {
        part.id: {"accepted_answers": part.accepted_answers, "value": None, "attempts_used": 0, "status": "open", "last_check": None}
        for item in definition.items
        for part in item.parts
        if isinstance(part, BlankPart)
    }
    session = ExerciseSession(id=uuid4(), exercise_id=exercise.id, user_id=user_id, state={"blanks": blanks}, expires_at=now + timedelta(hours=24))
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def _check_fill_blank(_db: Session, session: ExerciseSession, blank_id: str, answer: str) -> list[dict[str, Any]]:
    if not answer.strip():
        raise _validation_error(["answer"], "Ответ не может быть пустым")
    state = dict(session.state)
    blanks = dict(state.get("blanks", {}))
    blank = blanks.get(blank_id)
    if blank is None:
        raise HTTPException(status_code=404, detail="Пропуск не найден")
    if blank["status"] != "open":
        raise HTTPException(status_code=409, detail="Пропуск уже закрыт")
    blank = dict(blank)
    blank["value"] = answer
    blank["attempts_used"] += 1
    correct = answer.strip().casefold() in {candidate.strip().casefold() for candidate in blank["accepted_answers"]}
    blank["last_check"] = "correct" if correct else "incorrect"
    blank["status"] = "correct" if correct else ("exhausted" if blank["attempts_used"] >= 3 else "open")
    blanks[blank_id] = blank
    state["blanks"] = blanks
    session.state = state
    return _safe_states(state)


TYPE_REGISTRY: dict[tuple[str, int], ExerciseTypeHandler] = {
    ("form_table", 1): ExerciseTypeHandler("Таблица форм", FormTableDefinition, _serialize_vocabulary_source),
    ("single_input", 1): ExerciseTypeHandler("Ввод одной формы", SingleInputDefinition, _serialize_vocabulary_source),
    ("self_check", 1): ExerciseTypeHandler("Самопроверка", SelfCheckDefinition, _serialize_vocabulary_source),
    ("fill_blanks", 1): ExerciseTypeHandler("Заполнение пропусков", FillBlanksDefinition, _serialize_fill_blanks, _create_fill_blanks_session, _check_fill_blank),
}


def _type_handler(type_code: str, schema_version: int) -> ExerciseTypeHandler:
    handler = TYPE_REGISTRY.get((type_code, schema_version))
    if handler is None:
        raise HTTPException(status_code=422, detail=[
            _issue(["type_code"], "Неподдерживаемый тип упражнения или версия схемы"),
            _issue(["schema_version"], "Неподдерживаемый тип упражнения или версия схемы"),
        ])
    return handler


def validate_definition(type_code: str, schema_version: int, definition: dict[str, Any]) -> dict[str, Any]:
    handler = _type_handler(type_code, schema_version)
    try:
        parsed = handler.definition_model.model_validate(definition)
    except ValidationError as error:
        details = []
        for item in error.errors(include_url=False):
            safe_item = dict(item)
            safe_item["loc"] = ["body", "definition", *safe_item["loc"]]
            context = safe_item.get("ctx")
            if context and "error" in context:
                safe_context = dict(context)
                safe_context["error"] = str(safe_context["error"])
                safe_item["ctx"] = safe_context
            details.append(safe_item)
        raise HTTPException(status_code=422, detail=details) from error
    if hasattr(parsed, "source_code"):
        source = SOURCE_REGISTRY.get(parsed.source_code)
        if source is None or source.type_code != type_code:
            raise _validation_error(["definition", "source_code"], "Недопустимый источник словаря")
        if isinstance(parsed, FormTableDefinition):
            invalid_columns = [index for index, column in enumerate(parsed.columns) if column.key not in source.allowed_columns]
            if invalid_columns:
                raise HTTPException(status_code=422, detail=[
                    _issue(["definition", "columns", index, "key"], "Колонка несовместима с выбранным источником")
                    for index in invalid_columns
                ])
    return parsed.model_dump(mode="json")


def list_types() -> list[dict[str, Any]]:
    return [{"code": code, "label": handler.label, "schema_version": version} for (code, version), handler in TYPE_REGISTRY.items()]


def load_content(db: Session, exercise: Exercise, user_id: int) -> dict[str, Any]:
    definition = validate_definition(exercise.type_code, exercise.schema_version, exercise.definition)
    return _type_handler(exercise.type_code, exercise.schema_version).learner_serializer(db, definition, user_id)


def exercise_detail(db: Session, slug: str, user_id: int) -> dict[str, Any]:
    exercise = db.query(Exercise).filter(Exercise.slug == slug, Exercise.status == "published").first()
    if exercise is None:
        raise HTTPException(status_code=404, detail="Упражнение не найдено")
    response = {
        "slug": exercise.slug, "title": exercise.title, "description": exercise.description,
        "difficulty": exercise.difficulty, "estimated_duration_minutes": exercise.estimated_duration_minutes,
        "type_code": exercise.type_code, "schema_version": exercise.schema_version,
        "instruction": exercise.instruction, "content": load_content(db, exercise, user_id),
    }
    return TypeAdapter(LearnerExerciseResponse).validate_python(response).model_dump(mode="json", exclude_unset=True)


def create_exercise_session(db: Session, exercise: Exercise, user_id: int) -> ExerciseSession:
    handler = _type_handler(exercise.type_code, exercise.schema_version)
    if handler.session_creator is None:
        raise _validation_error(["type_code"], "Серверная сессия недоступна для этого типа упражнения")
    return handler.session_creator(db, exercise, user_id)


def check_blank(db: Session, session_id: UUID, user_id: int, blank_id: str, answer: str) -> list[dict[str, Any]]:
    now = datetime.now(timezone.utc)
    # Commit cleanup independently: malformed request data must not retain other
    # expired sessions by rolling back the transaction.
    db.execute(delete(ExerciseSession).where(ExerciseSession.expires_at <= now, ExerciseSession.id != session_id))
    db.commit()
    session = db.query(ExerciseSession).filter(ExerciseSession.id == session_id, ExerciseSession.user_id == user_id).with_for_update().first()
    if session is None:
        raise HTTPException(status_code=404, detail="Сессия не найдена")
    if session.expires_at <= now:
        db.delete(session)
        db.commit()
        raise HTTPException(status_code=410, detail="Сессия упражнения истекла")
    exercise = db.get(Exercise, session.exercise_id)
    if exercise is None:
        raise HTTPException(status_code=404, detail="Упражнение не найдено")
    checker = _type_handler(exercise.type_code, exercise.schema_version).blank_checker
    if checker is None:
        raise _validation_error(["blank_id"], "Проверка пропусков недоступна для этого типа упражнения")
    states = checker(db, session, blank_id, answer)
    db.commit()
    return states

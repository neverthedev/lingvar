"""Exercise type and vocabulary-source registries.

The registries are the one place where a code-supported exercise type or a
named read-only vocabulary query is declared. Database records select only
from these entries; they cannot describe arbitrary tables or SQL.
"""
from __future__ import annotations

from dataclasses import dataclass
from copy import deepcopy
from datetime import datetime, timedelta, timezone
import base64
import secrets
from typing import Any, Callable

from fastapi import HTTPException
from pydantic import BaseModel, TypeAdapter, ValidationError
from sqlalchemy import Float, case, cast, delete, func, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

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


TYPE_REGISTRY: dict[tuple[str, int], ExerciseTypeHandler] = {
    ("form_table", 1): ExerciseTypeHandler("Таблица форм", FormTableDefinition, _serialize_vocabulary_source),
    ("single_input", 1): ExerciseTypeHandler("Ввод одной формы", SingleInputDefinition, _serialize_vocabulary_source),
    ("self_check", 1): ExerciseTypeHandler("Самопроверка", SelfCheckDefinition, _serialize_vocabulary_source),
    ("fill_blanks", 1): ExerciseTypeHandler("Заполнение пропусков", FillBlanksDefinition, _serialize_fill_blanks),
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


SESSION_TTL = timedelta(hours=24)


def _not_found() -> HTTPException:
    # Deliberately identical for malformed, expired, foreign and wrong-exercise IDs.
    return HTTPException(status_code=404, detail="Сессия не найдена")


def _public_id() -> str:
    return base64.urlsafe_b64encode(secrets.token_bytes(16)).rstrip(b"=").decode("ascii")


def _metadata(exercise: Exercise) -> dict[str, Any]:
    return {
        "slug": exercise.slug,
        "title": exercise.title,
        "description": exercise.description,
        "instruction": exercise.instruction,
        "difficulty": exercise.difficulty,
        "estimated_duration_minutes": exercise.estimated_duration_minutes,
        "type_code": exercise.type_code,
        "schema_version": exercise.schema_version,
    }


def _blank_state() -> dict[str, Any]:
    return {"value": None, "attempts_used": 0, "status": "open", "last_check": None}


def _session_state(db: Session, exercise: Exercise, user_id: int) -> dict[str, Any]:
    """Create the immutable content snapshot and its server-only answer key."""
    raw_content = load_content(db, exercise, user_id)
    state: dict[str, Any] = {"metadata": _metadata(exercise)}

    if exercise.type_code == "form_table":
        rows = raw_content["rows"]
        state["content"] = {**raw_content, "rows": [{key: value for key, value in row.items() if key != "answers"} for row in rows]}
        state["answers"] = {str(row["id"]): row["answers"] for row in rows}
        state["progress"] = {
            "cells": {
                f"{row['id']}:{column['key']}": _blank_state()
                for row in rows for column in raw_content["columns"]
            },
            "rows": {
                str(row["id"]): {"completed": False, "all_correct": None, "weight": row.get("weight", 0)}
                for row in rows
            },
        }
    elif exercise.type_code == "single_input":
        items = raw_content["items"]
        state["content"] = {**raw_content, "items": [{key: value for key, value in item.items() if key != "answer"} for item in items]}
        state["answers"] = {str(item["id"]): item["answer"] for item in items}
        state["progress"] = {"items": {str(item["id"]): _blank_state() for item in items}}
    elif exercise.type_code == "self_check":
        items = raw_content["items"]
        state["content"] = {"items": [{key: value for key, value in item.items() if key != "answer"} for item in items]}
        state["answers"] = {str(item["id"]): item["answer"] for item in items}
        state["progress"] = {"items": {str(item["id"]): {"revealed": False, "result": None} for item in items}}
    elif exercise.type_code == "fill_blanks":
        definition = FillBlanksDefinition.model_validate(exercise.definition)
        state["content"] = raw_content
        state["answers"] = {
            part.id: part.accepted_answers
            for item in definition.items for part in item.parts if isinstance(part, BlankPart)
        }
        state["progress"] = {"blanks": {
            part_id: _blank_state() for part_id in state["answers"]
        }}
    else:
        raise _validation_error(["type_code"], "Серверная сессия недоступна для этого типа упражнения")
    return state


def _public_progress(state: dict[str, Any]) -> dict[str, Any]:
    progress = deepcopy(state["progress"])
    if state["metadata"]["type_code"] == "form_table":
        for cell_key, cell in progress["cells"].items():
            if cell["status"] == "exhausted":
                row_id, column_key = cell_key.split(":", 1)
                cell["revealed_answer"] = state["answers"][row_id][column_key]
    if state["metadata"]["type_code"] == "self_check":
        for item_id, item in progress["items"].items():
            if item["revealed"]:
                item["answer"] = state["answers"][item_id]
    if state["metadata"]["type_code"] == "single_input":
        for item_id, item in progress["items"].items():
            if item["status"] == "exhausted":
                item["revealed_answer"] = state["answers"][item_id]
    if state["metadata"]["type_code"] == "fill_blanks":
        for blank_id, blank in progress["blanks"].items():
            if blank["status"] == "exhausted":
                blank["revealed_answers"] = state["answers"][blank_id]
    return progress


def _payload(session: ExerciseSession) -> dict[str, Any]:
    state = session.state
    return {
        "session_id": session.public_id,
        "expires_at": session.expires_at,
        "revision": session.revision,
        **deepcopy(state["metadata"]),
        "content": deepcopy(state["content"]),
        "progress": _public_progress(state),
    }


def _new_session(db: Session, exercise: Exercise, user_id: int) -> ExerciseSession:
    now = datetime.now(timezone.utc)
    state = _session_state(db, exercise, user_id)
    # The unique index is the final collision guard. A savepoint makes the
    # astronomically rare retry safe without rolling back the caller's work.
    while True:
        session = ExerciseSession(
            public_id=_public_id(), exercise_id=exercise.id, user_id=user_id,
            state=state, created_at=now, expires_at=now + SESSION_TTL, revision=1,
        )
        try:
            with db.begin_nested():
                db.add(session)
                db.flush()
            return session
        except IntegrityError as error:
            diagnostic = getattr(error.orig, "diag", None)
            if getattr(diagnostic, "constraint_name", None) != "uq_exercise_sessions_public_id":
                raise


def _active_session(db: Session, slug: str, public_id: str, user_id: int, *, lock: bool) -> ExerciseSession:
    query = db.query(ExerciseSession).join(Exercise, ExerciseSession.exercise_id == Exercise.id).filter(
        ExerciseSession.public_id == public_id, ExerciseSession.user_id == user_id, Exercise.slug == slug,
    )
    session = (query.with_for_update() if lock else query).first()
    if session is None:
        raise _not_found()
    if session.expires_at <= datetime.now(timezone.utc):
        db.delete(session)
        db.commit()
        raise _not_found()
    return session


def create_session(db: Session, slug: str, user_id: int) -> dict[str, Any]:
    exercise = db.query(Exercise).filter(Exercise.slug == slug, Exercise.status == "published").first()
    if exercise is None:
        raise HTTPException(status_code=404, detail="Упражнение не найдено")
    session = _new_session(db, exercise, user_id)
    db.commit()
    db.refresh(session)
    return _payload(session)


def get_session(db: Session, slug: str, public_id: str, user_id: int) -> dict[str, Any]:
    return _payload(_active_session(db, slug, public_id, user_id, lock=False))


def restart_session(db: Session, slug: str, public_id: str, user_id: int) -> dict[str, Any]:
    exercise = db.query(Exercise).filter(Exercise.slug == slug, Exercise.status == "published").first()
    if exercise is None:
        raise HTTPException(status_code=404, detail="Упражнение не найдено")
    try:
        session = _active_session(db, slug, public_id, user_id, lock=True)
    except HTTPException as error:
        if error.status_code != 404:
            raise
    else:
        db.delete(session)
        db.flush()
    fresh = _new_session(db, exercise, user_id)
    db.commit()
    db.refresh(fresh)
    return _payload(fresh)


def _word_stat(db: Session, user_id: int, word_type: str, word_id: int) -> WordTestStat:
    stat = db.query(WordTestStat).filter_by(user_id=user_id, word_type=word_type, word_id=word_id).with_for_update().first()
    if stat is None:
        stat = WordTestStat(user_id=user_id, word_type=word_type, word_id=word_id, attempts=0, correct=0, last_correct=False, weight=0)
        db.add(stat)
    return stat


def _require_open_check(entry: dict[str, Any], expected_attempts: int) -> bool:
    """Return false for a repeated stale request, otherwise validate openness."""
    if expected_attempts != entry["attempts_used"]:
        return False
    if entry["status"] != "open":
        raise HTTPException(status_code=409, detail="Ответ уже закрыт")
    return True


def _check_answer(entry: dict[str, Any], answer: str, accepted_answers: list[str] | str, max_attempts: int = 3) -> bool:
    if not answer.strip():
        raise _validation_error(["answer"], "Ответ не может быть пустым")
    candidates = accepted_answers if isinstance(accepted_answers, list) else [accepted_answers]
    correct = answer.strip().casefold() in {candidate.strip().casefold() for candidate in candidates}
    entry["value"] = answer
    entry["attempts_used"] += 1
    entry["last_check"] = "correct" if correct else "incorrect"
    entry["status"] = "correct" if correct else ("exhausted" if entry["attempts_used"] >= max_attempts else "open")
    return correct


def _form_check(db: Session, session: ExerciseSession, action: dict[str, Any]) -> bool:
    state = session.state
    row_id, column_key = str(action["row_id"]), action["column_key"]
    answers = state["answers"].get(row_id)
    if answers is None or column_key not in answers:
        raise HTTPException(status_code=409, detail="Ячейка не входит в снимок сессии")
    cell = state["progress"]["cells"][f"{row_id}:{column_key}"]
    if not _require_open_check(cell, action["expected_attempts_used"]):
        return False
    correct = _check_answer(cell, action["answer"], answers[column_key])
    meta = state["metadata"]
    stat = _word_stat(db, session.user_id, state["content"]["statistics_word_type"], int(row_id))
    stat.attempts += 1
    if correct:
        stat.correct += 1
    stat.last_correct = False
    columns = state["content"]["columns"]
    row_progress = state["progress"]["rows"][row_id]
    cells = state["progress"]["cells"]
    if not row_progress["completed"] and all(cells[f"{row_id}:{column['key']}"]["status"] != "open" for column in columns):
        row_progress["completed"] = True
        row_progress["all_correct"] = all(cells[f"{row_id}:{column['key']}"]["status"] == "correct" for column in columns)
        stat.last_tested_at = func.now()
        stat.last_correct = row_progress["all_correct"]
    return True


def _form_weight(db: Session, session: ExerciseSession, action: dict[str, Any]) -> bool:
    row_id = str(action["row_id"])
    row = session.state["progress"]["rows"].get(row_id)
    if row is None:
        raise HTTPException(status_code=409, detail="Строка не входит в снимок сессии")
    stat = _word_stat(db, session.user_id, session.state["content"]["statistics_word_type"], int(row_id))
    stat.weight = max(-5, min(5, (stat.weight or 0) + (1 if action["direction"] == "up" else -1)))
    row["weight"] = stat.weight
    return True


def _single_check(session: ExerciseSession, action: dict[str, Any]) -> bool:
    item_id = str(action["item_id"])
    item = session.state["progress"]["items"].get(item_id)
    answer = session.state["answers"].get(item_id)
    if item is None or answer is None:
        raise HTTPException(status_code=409, detail="Задание не входит в снимок сессии")
    if not _require_open_check(item, action["expected_attempts_used"]):
        return False
    _check_answer(item, action["answer"], answer)
    return True


def _self_reveal(session: ExerciseSession, action: dict[str, Any]) -> bool:
    item = session.state["progress"]["items"].get(str(action["item_id"]))
    if item is None:
        raise HTTPException(status_code=409, detail="Задание не входит в снимок сессии")
    if item["revealed"]:
        return False
    item["revealed"] = True
    return True


def _self_mark(session: ExerciseSession, action: dict[str, Any]) -> bool:
    item = session.state["progress"]["items"].get(str(action["item_id"]))
    if item is None:
        raise HTTPException(status_code=409, detail="Задание не входит в снимок сессии")
    if not item["revealed"]:
        raise HTTPException(status_code=409, detail="Сначала покажите ответ")
    if item["result"] is not None:
        return False
    item["result"] = action["result"]
    return True


def _fill_check(session: ExerciseSession, action: dict[str, Any]) -> bool:
    blank_id = action["blank_id"]
    blank = session.state["progress"]["blanks"].get(blank_id)
    answers = session.state["answers"].get(blank_id)
    if blank is None or answers is None:
        raise HTTPException(status_code=409, detail="Пропуск не входит в снимок сессии")
    if not _require_open_check(blank, action["expected_attempts_used"]):
        return False
    _check_answer(blank, action["answer"], answers)
    return True


def apply_session_action(db: Session, slug: str, public_id: str, user_id: int, action: dict[str, Any]) -> dict[str, Any]:
    session = _active_session(db, slug, public_id, user_id, lock=True)
    action_type = action["action"]
    type_code = session.state["metadata"]["type_code"]
    handlers: dict[str, tuple[str, Callable[..., bool]]] = {
        "form_table_check": ("form_table", _form_check),
        "form_table_weight": ("form_table", _form_weight),
        "single_input_check": ("single_input", _single_check),
        "self_check_reveal": ("self_check", _self_reveal),
        "self_check_mark": ("self_check", _self_mark),
        "fill_blank_check": ("fill_blanks", _fill_check),
    }
    expected_type, handler = handlers[action_type]
    if expected_type != type_code:
        raise HTTPException(status_code=409, detail="Действие несовместимо с упражнением")
    changed = handler(db, session, action) if action_type.startswith("form_") else handler(session, action)
    if changed:
        # JSONB does not track mutations below the top-level dict. All action
        # handlers update their nested progress in place, so explicitly mark
        # the attribute dirty before committing the session and related stats.
        flag_modified(session, "state")
        session.revision += 1
        db.commit()
        db.refresh(session)
    return _payload(session)


# Legacy endpoint compatibility for clients that still call the old fill-blank URL.
def check_blank(db: Session, public_id: str, user_id: int, blank_id: str, answer: str) -> list[dict[str, Any]]:
    session = db.query(ExerciseSession).filter(ExerciseSession.public_id == public_id, ExerciseSession.user_id == user_id).first()
    if session is None or session.state["metadata"]["type_code"] != "fill_blanks":
        raise _not_found()
    slug = session.state["metadata"]["slug"]
    result = apply_session_action(db, slug, public_id, user_id, {
        "action": "fill_blank_check", "blank_id": blank_id, "answer": answer,
        "expected_attempts_used": session.state["progress"]["blanks"].get(blank_id, {}).get("attempts_used", 0),
    })
    return [{"id": key, **value} for key, value in result["progress"]["blanks"].items()]

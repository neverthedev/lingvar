"""Administrative CRUD endpoints for the hierarchy of learning rules."""

from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field, validator
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from models.exercise import Exercise
from models.vocabulary import Rule
from services.database import get_db
from services.exercises import exercise_blank_rule_references, lock_rules_table, stored_rule_assignments_are_valid


router = APIRouter(prefix="/rules", tags=["admin"])


class RulePayload(BaseModel):
    title: str
    description: str
    parent_rule_id: int | None = None

    @validator("title", "description")
    def trim_and_require_content(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field must not be empty.")
        return value

    @validator("title")
    def title_must_fit_storage_limit(cls, value: str) -> str:
        if len(value) > 200:
            raise ValueError("Title must be at most 200 characters long.")
        return value


class RuleNode(BaseModel):
    id: int
    title: str
    description: str
    parent_rule_id: int | None
    ordering: int | None
    children: list["RuleNode"] = Field(default_factory=list)


RuleNode.update_forward_refs()


def _rule_sort_key(rule: Rule) -> tuple[bool, int, str, int]:
    """Keep legacy rows with empty/duplicate order values deterministic."""
    return (
        rule.ordering is None,
        rule.ordering if rule.ordering is not None else 0,
        rule.title,
        rule.id,
    )


def _node_from_rule(rule: Rule, children: list[RuleNode] | None = None) -> RuleNode:
    return RuleNode(
        id=rule.id,
        title=rule.title,
        description=rule.description,
        parent_rule_id=rule.parent_rule_id,
        ordering=rule.ordering,
        children=children or [],
    )


def _build_forest(rules: list[Rule]) -> list[RuleNode]:
    children_by_parent: dict[int | None, list[Rule]] = defaultdict(list)
    known_ids = {rule.id for rule in rules}
    for rule in rules:
        # A broken legacy reference is still shown rather than silently hiding a rule.
        parent_id = rule.parent_rule_id if rule.parent_rule_id in known_ids else None
        children_by_parent[parent_id].append(rule)

    def build(parent_id: int | None) -> list[RuleNode]:
        return [
            _node_from_rule(rule, build(rule.id))
            for rule in sorted(children_by_parent[parent_id], key=_rule_sort_key)
        ]

    return build(None)


def _get_rule_or_404(db: Session, rule_id: int, message: str = "Rule was not found.") -> Rule:
    rule = db.query(Rule).filter(Rule.id == rule_id).one_or_none()
    if rule is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=message)
    return rule


def _validate_parent(db: Session, rule_id: int, parent_rule_id: int | None) -> Rule | None:
    if parent_rule_id is None:
        return None
    if parent_rule_id == rule_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A rule cannot be its own parent.",
        )

    parent = _get_rule_or_404(db, parent_rule_id, "Parent rule was not found.")
    descendant = db.execute(
        text(
            """
            WITH RECURSIVE subtree AS (
                SELECT id FROM rules WHERE id = :rule_id
                UNION ALL
                SELECT child.id
                FROM rules AS child
                JOIN subtree ON child.parent_rule_id = subtree.id
            )
            SELECT 1 FROM subtree WHERE id = :parent_rule_id LIMIT 1
            """
        ),
        {"rule_id": rule_id, "parent_rule_id": parent_rule_id},
    ).scalar()
    if descendant:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A rule cannot be moved under one of its descendants.",
        )
    return parent


def _next_ordering(db: Session, parent_rule_id: int | None, exclude_rule_id: int | None = None) -> int:
    query = db.query(Rule).filter(Rule.parent_rule_id.is_(None) if parent_rule_id is None else Rule.parent_rule_id == parent_rule_id)
    if exclude_rule_id is not None:
        query = query.filter(Rule.id != exclude_rule_id)
    existing_ordering = [rule.ordering for rule in query.all() if rule.ordering is not None]
    return (max(existing_ordering) + 1) if existing_ordering else 0


@router.get("", response_model=list[RuleNode])
async def list_rules(db: Session = Depends(get_db)):
    """Return the complete rule forest in its display order."""
    return _build_forest(db.query(Rule).all())


@router.post("", response_model=RuleNode, status_code=status.HTTP_201_CREATED)
async def create_rule(payload: RulePayload, db: Session = Depends(get_db)):
    try:
        lock_rules_table(db)
        if payload.parent_rule_id is not None:
            _get_rule_or_404(db, payload.parent_rule_id, "Parent rule was not found.")

        rule = Rule(
            title=payload.title,
            description=payload.description,
            parent_rule_id=payload.parent_rule_id,
            ordering=_next_ordering(db, payload.parent_rule_id),
        )
        db.add(rule)
        db.commit()
        db.refresh(rule)
        return _node_from_rule(rule)
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create rule. Changes were not saved.",
        ) from error


@router.put("/{rule_id}", response_model=RuleNode)
async def update_rule(rule_id: int, payload: RulePayload, db: Session = Depends(get_db)):
    try:
        lock_rules_table(db)
        rule = _get_rule_or_404(db, rule_id)
        _validate_parent(db, rule.id, payload.parent_rule_id)

        parent_changed = rule.parent_rule_id != payload.parent_rule_id
        rule.title = payload.title
        rule.description = payload.description
        if parent_changed:
            rule.parent_rule_id = payload.parent_rule_id
            rule.ordering = _next_ordering(db, payload.parent_rule_id, exclude_rule_id=rule.id)
            db.flush()
            if not stored_rule_assignments_are_valid(db):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Перенос нарушает связь правила упражнения с правилом пропуска.",
                )

        db.commit()
        db.refresh(rule)
        return _node_from_rule(rule)
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to save rule. Changes were not saved.",
        ) from error


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rule(rule_id: int, db: Session = Depends(get_db)) -> Response:
    try:
        lock_rules_table(db)
        rule = _get_rule_or_404(db, rule_id)
        if db.query(Exercise.id).filter(Exercise.rule_id == rule.id).first() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Правило нельзя удалить: оно назначено упражнению.",
            )
        for exercise in db.query(Exercise).filter(Exercise.type_code == "fill_blanks").all():
            if any(blank_rule_id == rule.id for blank_rule_id in exercise_blank_rule_references(exercise)):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Правило нельзя удалить: оно назначено пропуску упражнения.",
                )
        new_parent_id = rule.parent_rule_id
        children = (
            db.query(Rule)
            .filter(Rule.parent_rule_id == rule.id)
            .all()
        )
        next_ordering = _next_ordering(db, new_parent_id, exclude_rule_id=rule.id)
        for index, child in enumerate(sorted(children, key=_rule_sort_key)):
            # Do this with SQL rather than ``db.delete(rule)`` plus ORM field
            # assignments.  The self-referential relationship's delete cascade
            # bookkeeping may otherwise null out a loaded child's FK again.
            db.execute(
                text(
                    "UPDATE rules SET parent_rule_id = :parent_rule_id, ordering = :ordering "
                    "WHERE id = :child_id"
                ),
                {
                    "parent_rule_id": new_parent_id,
                    "ordering": next_ordering + index,
                    "child_id": child.id,
                },
            )

        db.execute(text("DELETE FROM rules WHERE id = :rule_id"), {"rule_id": rule.id})
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete rule. Changes were not saved.",
        ) from error

"""Learner-facing read-only rule trees."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from models.user import User
from models.vocabulary import Rule
from services.auth import get_current_student_user
from services.database import get_db
from services.rules import children_by_parent, root_rule_id, rule_projection


router = APIRouter(prefix="/api/rules", tags=["rules"])


@router.get("/{rule_id}")
async def get_rule(
    rule_id: int,
    current_user: User = Depends(get_current_student_user),
    db: Session = Depends(get_db),
):
    rules = db.query(Rule).all()
    canonical_rule_id = root_rule_id(rules, rule_id)
    if canonical_rule_id is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Правило не найдено")
    by_id = {rule.id: rule for rule in rules}
    root = by_id[canonical_rule_id]
    return {
        "canonical_rule_id": canonical_rule_id,
        "rule": rule_projection(root, children_by_parent(rules), include_ids=True),
    }

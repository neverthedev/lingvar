from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from services.database import get_db
from models.vocabulary import WordTestStat
from models.user import User as DBUser
from services.auth import get_current_student_user

router = APIRouter(
    prefix="/api/tests",
    tags=["tests"],
    dependencies=[Depends(get_current_student_user)],
    responses={404: {"description": "Not found"}},
)

class TestAttemptIn(BaseModel):
    word_type: str
    word_id: int
    is_correct: bool

class TestCompleteIn(BaseModel):
    word_type: str
    word_id: int
    all_correct: bool

class TestWeightIn(BaseModel):
    word_type: str
    word_id: int
    direction: str  # "up" or "down"

@router.post("/attempt")
async def test_attempt(
    payload: TestAttemptIn,
    current_user: DBUser = Depends(get_current_student_user),
    db: Session = Depends(get_db)
):
    stat = db.query(WordTestStat).filter_by(
        user_id=current_user.id,
        word_type=payload.word_type,
        word_id=payload.word_id
    ).first()

    if stat is None:
        stat = WordTestStat(
            user_id=current_user.id,
            word_type=payload.word_type,
            word_id=payload.word_id,
            attempts=0,
            correct=0,
            last_correct=False
        )
        db.add(stat)

    stat.attempts += 1
    if payload.is_correct:
        stat.correct += 1

    # Until the session is completed, mark as not fully correct
    stat.last_correct = False

    db.commit()
    return {"ok": True}

@router.post("/complete")
async def test_complete(
    payload: TestCompleteIn,
    current_user: DBUser = Depends(get_current_student_user),
    db: Session = Depends(get_db)
):
    stat = db.query(WordTestStat).filter_by(
        user_id=current_user.id,
        word_type=payload.word_type,
        word_id=payload.word_id
    ).first()

    if stat is None:
        stat = WordTestStat(
            user_id=current_user.id,
            word_type=payload.word_type,
            word_id=payload.word_id,
            attempts=0,
            correct=0
        )
        db.add(stat)

    stat.last_tested_at = func.now()
    stat.last_correct = payload.all_correct

    db.commit()
    return {"ok": True}

@router.post("/weight")
async def test_weight(
    payload: TestWeightIn,
    current_user: DBUser = Depends(get_current_student_user),
    db: Session = Depends(get_db)
):
    if payload.direction not in {"up", "down"}:
        return {"ok": False, "detail": "direction must be 'up' or 'down'"}

    stat = db.query(WordTestStat).filter_by(
        user_id=current_user.id,
        word_type=payload.word_type,
        word_id=payload.word_id
    ).first()

    if stat is None:
        stat = WordTestStat(
            user_id=current_user.id,
            word_type=payload.word_type,
            word_id=payload.word_id,
            attempts=0,
            correct=0,
            last_correct=False,
            weight=0
        )
        db.add(stat)

    delta = 1 if payload.direction == "up" else -1
    new_weight = (stat.weight or 0) + delta
    # Clamp to keep it bounded
    stat.weight = max(-5, min(5, new_weight))

    db.commit()
    return {"ok": True, "weight": stat.weight}

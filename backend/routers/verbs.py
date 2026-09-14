from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case, Float, cast, text

from services.database import get_db
from models.vocabulary import Verb, WordTestStat
from models.user import User as DBUser
from services.auth import get_current_active_user

router = APIRouter(
    prefix="/api/verbs",
    tags=["verbs"],
    dependencies=[Depends(get_current_active_user)],
    responses={404: {"description": "Not found"}},
)

@router.get("/")
async def get_verbs(
    current_user: DBUser = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get 20 random Polish verbs with their conjugations"""
    # Define verb conjugation persons
    all_persons = ["ja", "ty", "ono", "my", "wy", "one"]

    # Fetch 20 verbs ranked by need (low accuracy), recency, and unseen bonus
    attempts = func.coalesce(WordTestStat.attempts, 0)
    correct = func.coalesce(WordTestStat.correct, 0)
    accuracy = func.coalesce(cast(correct, Float) / func.nullif(cast(attempts, Float), 0), 0.0)
    need = 1.0 - accuracy

    # Days since last tested, treating null as 365 days ago
    last_tested = func.coalesce(WordTestStat.last_tested_at, func.now() - text("interval '365 days'"))
    days_since = func.extract('epoch', func.now() - last_tested) / 86400.0
    recency = func.least(days_since / 30.0, 1.0)

    unseen = case((attempts == 0, 1.0), else_=0.0)
    weight = func.coalesce(WordTestStat.weight, 0)
    weight_norm = cast(weight, Float) / 5.0

    score = (0.5 * need) + (0.35 * recency) + (0.15 * unseen) + (0.2 * weight_norm)

    verbs = (
        db.query(Verb, WordTestStat.weight)
        .outerjoin(
            WordTestStat,
            (WordTestStat.word_id == Verb.id)
            & (WordTestStat.word_type == "verb")
            & (WordTestStat.user_id == current_user.id)
        )
        .order_by(
            score.desc(),
            func.random()
        )
        .limit(20)
        .all()
    )

    # Transform database records to API response format
    result = []
    for verb, weight_value in verbs:
        flat = {"id": verb.id, "word": verb.word, "weight": weight_value or 0}
        # Add all persons/forms from the JSONB cases field
        for person in all_persons:
            flat[person] = verb.cases.get(person, "")
        result.append(flat)

    return result

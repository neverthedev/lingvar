from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Union

from services.database import get_db
from models.vocabulary import Numerator
from models.user import User as DBUser
from services.auth import get_current_active_user

router = APIRouter(
    prefix="/numerators",
    tags=["exercises-numerators"],
    dependencies=[Depends(get_current_active_user)],
    responses={404: {"description": "Not found"}},
)


@router.get("/", response_model=List[Dict[str, Union[str, int]]])
async def get_numerators_exercise(
    current_user: DBUser = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get 20 random numerators with their Polish word and Russian translation for exercise.
    Returns random numerators from the database for translation practice.
    """
    # Get 20 random numerators from the database
    numerators = db.query(Numerator).order_by(func.random()).limit(20).all()

    exercise_items = []
    for numerator in numerators:
        exercise_items.append({
            "id": str(numerator.id),
            "word": numerator.word,
            "description": numerator.translation
        })

    return exercise_items

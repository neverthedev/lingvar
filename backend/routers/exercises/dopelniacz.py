from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Union

from services.database import get_db
from models.vocabulary import Noun
from models.user import User as DBUser
from services.auth import get_current_active_user

router = APIRouter(
    prefix="/dopelniacz",
    tags=["exercises-dopelniacz"],
    dependencies=[Depends(get_current_active_user)],
    responses={404: {"description": "Not found"}},
)


@router.get("/", response_model=List[Dict[str, Union[str, int]]])
async def get_dopelniacz_exercise(
    current_user: DBUser = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all nouns with their word and dopełniacz (genitive case) for exercise.
    Returns all nouns from the database with their genitive forms.
    """
    # Get all nouns from the database
    nouns = db.query(Noun).all()

    exercise_items = []
    for noun in nouns:
        # Extract dopełniacz from cases_pojed (singular cases)
        dopelniacz = ""
        if noun.cases_pojed and isinstance(noun.cases_pojed, dict):
            dopelniacz = noun.cases_pojed.get("dopełniacz", "")

        exercise_items.append({
            "id": str(noun.id),
            "word": noun.word,
            "dopelniacz": dopelniacz
        })

    return exercise_items

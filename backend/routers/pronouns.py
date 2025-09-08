from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from services.auth import get_current_active_user
from services.database import get_db
from models.user import User as DBUser
from models.vocabulary import Pronoun

router = APIRouter(
    prefix="/api/pronouns",
    tags=["pronouns"],
    dependencies=[Depends(get_current_active_user)],
    responses={404: {"description": "Not found"}},
)

@router.get("/")
async def get_pronouns(
    current_user: DBUser = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get Polish pronouns from database"""
    all_cases = ["mianownik", "dopełniacz", "celownik", "biernik", "narzędnik", "miejscownik", "wołacz"]

    # Fetch pronouns from database
    pronouns = db.query(Pronoun).order_by(Pronoun.id).all()

    # Transform database records to API response format
    result = []
    for pronoun in pronouns:
        flat = {"id": pronoun.id, "word": pronoun.word}
        # Add all cases from the JSONB cases field
        for case in all_cases:
            flat[case] = pronoun.cases.get(case, "")
        result.append(flat)

    return result

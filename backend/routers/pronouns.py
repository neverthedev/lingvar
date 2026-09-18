from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from services.auth import get_current_student_user
from services.database import get_db
from models.user import User as DBUser
from services.exercises import load_pronouns_cases


ALL_CASE_COLUMNS = [
    {"key": "mianownik", "label": "Mianownik"}, {"key": "dopełniacz", "label": "Dopełniacz"},
    {"key": "celownik", "label": "Celownik"}, {"key": "biernik", "label": "Biernik"},
    {"key": "narzędnik", "label": "Narzędnik"}, {"key": "miejscownik", "label": "Miejscownik"},
    {"key": "wołacz", "label": "Wołacz"},
]

router = APIRouter(
    prefix="/api/pronouns",
    tags=["pronouns"],
    dependencies=[Depends(get_current_student_user)],
    responses={404: {"description": "Not found"}},
)

@router.get("/")
async def get_pronouns(
    current_user: DBUser = Depends(get_current_student_user),
    db: Session = Depends(get_db)
):
    """Get Polish pronouns from database"""
    content = load_pronouns_cases(
        db,
        {"columns": ALL_CASE_COLUMNS, "sample_size": None, "max_attempts": 3},
        current_user.id,
    )
    return [{"id": row["id"], "word": row["prompt"], **row["answers"]} for row in content["rows"]]

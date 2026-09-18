from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from services.database import get_db
from models.user import User as DBUser
from services.auth import get_current_student_user
from services.exercises import load_nouns_singular_cases


ALL_CASE_COLUMNS = [
    {"key": "mianownik", "label": "Mianownik"}, {"key": "dopełniacz", "label": "Dopełniacz"},
    {"key": "celownik", "label": "Celownik"}, {"key": "biernik", "label": "Biernik"},
    {"key": "narzędnik", "label": "Narzędnik"}, {"key": "miejscownik", "label": "Miejscownik"},
    {"key": "wołacz", "label": "Wołacz"},
]

router = APIRouter(
    prefix="/api/nouns",
    tags=["nouns"],
    dependencies=[Depends(get_current_student_user)],
    responses={404: {"description": "Not found"}},
)

@router.get("/single")
async def get_nouns_single(
    current_user: DBUser = Depends(get_current_student_user),
    db: Session = Depends(get_db)
):
    """Get 20 random nouns with their single cases (flat JSON)"""
    content = load_nouns_singular_cases(
        db,
        {"columns": ALL_CASE_COLUMNS, "sample_size": 20, "max_attempts": 3},
        current_user.id,
    )
    return [{"id": row["id"], "word": row["prompt"], **row["answers"]} for row in content["rows"]]

@router.get("/plural")
async def get_nouns_plural(
    current_user: DBUser = Depends(get_current_student_user),
    db: Session = Depends(get_db)
):
    """Get 20 random nouns with their plural cases (stub implementation)"""
    nouns = db.query(Noun).order_by(func.random()).limit(20).all()
    all_cases = ["mianownik", "dopełniacz", "celownik", "biernik", "narzędnik", "miejscownik", "wołacz"]
    result = []
    for noun in nouns:
        # Start with all cases as empty string
        flat = {"id": noun.id, "word": noun.word}
        for case in all_cases:
            flat[case] = ""
        # Merge actual cases_mnoga values if present (stub - add plural logic here)
        if hasattr(noun, 'cases_mnoga') and isinstance(noun.cases_mnoga, dict):
            flat.update(noun.cases_mnoga)
        result.append(flat)
    return result

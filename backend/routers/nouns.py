from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db, Noun
from services.auth import get_current_active_user
from database import User as DBUser

router = APIRouter(
    prefix="/api/nouns",
    tags=["nouns"],
    dependencies=[Depends(get_current_active_user)],
    responses={404: {"description": "Not found"}},
)

@router.get("/single")
async def get_nouns_single(
    current_user: DBUser = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get 20 random nouns with their single cases (flat JSON)"""
    nouns = db.query(Noun).order_by(func.random()).limit(20).all()
    # Define all possible cases (adjust as needed for your language)
    all_cases = ["mianownik", "dopełniacz", "celownik", "biernik", "narzędnik", "miejscownik", "wołacz"]
    result = []
    for noun in nouns:
        # Start with all cases as empty string
        flat = {"id": noun.id, "word": noun.word}
        for case in all_cases:
            flat[case] = ""
        # Merge actual cases_pojed values if present
        if isinstance(noun.cases_pojed, dict):
            flat.update(noun.cases_pojed)
        result.append(flat)
    return result

@router.get("/plural")
async def get_nouns_plural(
    current_user: DBUser = Depends(get_current_active_user),
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

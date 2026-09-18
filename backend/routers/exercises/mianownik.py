from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Union

from services.database import get_db
from models.user import User as DBUser
from services.auth import get_current_student_user
from services.exercises import load_nouns_singular_to_plural_nominative

router = APIRouter(
    prefix="/mianownik",
    tags=["exercises-mianownik"],
    dependencies=[Depends(get_current_student_user)],
    responses={404: {"description": "Not found"}},
)

# Szef życzy wam, żebyście wejśli szybko na rynek
# Koleżanka życzy im, żeby nie jedli za dużo
# Tata życzy mu, żeby myślił nie tylko o sobie
# https://wordwall.net/resource/97784670/polish/mianownik-liczby-mnogiej-niem%C4%99skoosobowe-formy
@router.get("/mnoga", response_model=List[Dict[str, Union[str, int]]])
async def get_mianownik_mnoga_exercise(
    current_user: DBUser = Depends(get_current_student_user),
    db: Session = Depends(get_db)
):
    content = load_nouns_singular_to_plural_nominative(
        db,
        {"sample_size": 50, "max_attempts": 3, "reveal_after_exhaustion": True},
        current_user.id,
    )
    return [{"id": str(item["id"]), "word": item["answer"], "description": item["prompt"]} for item in content.get("items", [])]

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Union

from services.database import get_db
from models.user import User as DBUser
from services.auth import get_current_student_user
from services.exercises import load_numerators_translation_to_word

router = APIRouter(
    prefix="/numerators",
    tags=["exercises-numerators"],
    dependencies=[Depends(get_current_student_user)],
    responses={404: {"description": "Not found"}},
)


@router.get("/", response_model=List[Dict[str, Union[str, int]]])
async def get_numerators_exercise(
    current_user: DBUser = Depends(get_current_student_user),
    db: Session = Depends(get_db)
):
    content = load_numerators_translation_to_word(
        db,
        {"sample_size": 20, "max_attempts": 3, "reveal_after_exhaustion": True},
        current_user.id,
    )
    return [{"id": str(item["id"]), "word": item["answer"], "description": item["prompt"]} for item in content.get("items", [])]

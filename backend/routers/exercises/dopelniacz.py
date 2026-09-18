from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Union

from services.database import get_db
from models.user import User as DBUser
from services.auth import get_current_student_user
from services.exercises import load_nouns_plural_genitive, load_nouns_singular_genitive

router = APIRouter(
    prefix="/dopelniacz",
    tags=["exercises-dopelniacz"],
    dependencies=[Depends(get_current_student_user)],
    responses={404: {"description": "Not found"}},
)


@router.get("/pojed", response_model=List[Dict[str, Union[str, int]]])
async def get_dopelniacz_pojed_exercise(
    current_user: DBUser = Depends(get_current_student_user),
    db: Session = Depends(get_db)
):
    content = load_nouns_singular_genitive(db, {"sample_size": 50}, current_user.id)
    return [{"id": str(item["id"]), "word": item["prompt"], "dopelniacz": item["answer"]} for item in content.get("items", [])]


@router.get("/mnoga", response_model=List[Dict[str, Union[str, int]]])
async def get_dopelniacz_mnoga_exercise(
    current_user: DBUser = Depends(get_current_student_user),
    db: Session = Depends(get_db)
):
    content = load_nouns_plural_genitive(db, {"sample_size": 50}, current_user.id)
    return [{"id": str(item["id"]), "word": item["prompt"], "dopelniacz": item["answer"]} for item in content.get("items", [])]

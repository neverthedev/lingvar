from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from services.database import get_db
from models.vocabulary import Verb
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

    # Fetch 20 random verbs from database
    verbs = db.query(Verb).order_by(func.random()).limit(20).all()

    # Transform database records to API response format
    result = []
    for verb in verbs:
        flat = {"id": verb.id, "word": verb.word}
        # Add all persons/forms from the JSONB cases field
        for person in all_persons:
            flat[person] = verb.cases.get(person, "")
        result.append(flat)

    return result

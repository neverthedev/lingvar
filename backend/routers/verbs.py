from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from services.database import get_db
from models.user import User as DBUser
from services.auth import get_current_student_user
from services.exercises import load_verbs_present_cases


VERB_COLUMNS = [
    {"key": "ja", "label": "Ja"}, {"key": "ty", "label": "Ty"}, {"key": "ono", "label": "On/Ona/Ono"},
    {"key": "my", "label": "My"}, {"key": "wy", "label": "Wy"}, {"key": "one", "label": "Oni/One"},
]

router = APIRouter(
    prefix="/api/verbs",
    tags=["verbs"],
    dependencies=[Depends(get_current_student_user)],
    responses={404: {"description": "Not found"}},
)

@router.get("/")
async def get_verbs(
    current_user: DBUser = Depends(get_current_student_user),
    db: Session = Depends(get_db)
):
    """Get 20 random Polish verbs with their conjugations"""
    content = load_verbs_present_cases(
        db,
        {"columns": VERB_COLUMNS, "sample_size": 20, "max_attempts": 3},
        current_user.id,
    )
    return [{"id": row["id"], "word": row["prompt"], "weight": row["weight"], **row["answers"]} for row in content["rows"]]

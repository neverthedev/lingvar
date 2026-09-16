from fastapi import APIRouter, Depends
from pydantic import BaseModel

from models.user import User
from routers.exercises.catalog import EXERCISE_CATALOG
from services.auth import get_current_admin_user

router = APIRouter(
    prefix="/admin",
    dependencies=[Depends(get_current_admin_user)],
)


class ExerciseMetadata(BaseModel):
    id: str
    title: str


@router.get("/exercises", response_model=list[ExerciseMetadata], tags=["admin"])
async def list_exercises(current_user: User = Depends(get_current_admin_user)):
    """Return catalog metadata without exercise content or execution endpoints."""
    return [ExerciseMetadata(id=exercise.id, title=exercise.title) for exercise in EXERCISE_CATALOG]

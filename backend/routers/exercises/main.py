from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .dopelniacz import router as dopelniacz_router
from .numerators import router as numerators_router
from .mianownik import router as mianownik_router
from models.exercise import Exercise
from models.user import User as DBUser
from services.auth import get_current_student_user
from services.database import get_db
from services.exercises import _safe_states, check_blank, create_exercise_session, exercise_detail
from schemas.exercises import BlankCheckRequest, LearnerCatalogItem, LearnerExerciseResponse

# Main exercises router
router = APIRouter(
    prefix="/api/exercises",
    dependencies=[Depends(get_current_student_user)],
)

# Include sub-routers
router.include_router(dopelniacz_router)
router.include_router(numerators_router)
router.include_router(mianownik_router)

@router.get("/", tags=["exercises"], response_model=list[LearnerCatalogItem])
async def exercises_root(
    current_user: DBUser = Depends(get_current_student_user), db: Session = Depends(get_db)
):
    exercises = db.query(Exercise).filter(Exercise.status == "published").order_by(Exercise.display_order, Exercise.id).all()
    return [{"slug": item.slug, "title": item.title, "description": item.description, "difficulty": item.difficulty, "estimated_duration_minutes": item.estimated_duration_minutes, "type_code": item.type_code} for item in exercises]


@router.get("/{slug}/content", tags=["exercises"], response_model=LearnerExerciseResponse)
async def get_exercise_content(slug: str, current_user: DBUser = Depends(get_current_student_user), db: Session = Depends(get_db)):
    return exercise_detail(db, slug, current_user.id)


@router.post("/{slug}/sessions", status_code=status.HTTP_201_CREATED, tags=["exercises"])
async def create_session(slug: str, current_user: DBUser = Depends(get_current_student_user), db: Session = Depends(get_db)):
    exercise = db.query(Exercise).filter(Exercise.slug == slug, Exercise.status == "published").first()
    if exercise is None:
        raise HTTPException(status_code=404, detail="Упражнение не найдено")
    session = create_exercise_session(db, exercise, current_user.id)
    return {"session_id": str(session.id), "expires_at": session.expires_at, "blanks": _safe_states(session.state)}


session_router = APIRouter(prefix="/api/exercise-sessions", dependencies=[Depends(get_current_student_user)])


@session_router.post("/{session_id}/blanks/{blank_id}/check", tags=["exercises"])
async def check_session_blank(session_id: UUID, blank_id: str, payload: BlankCheckRequest, current_user: DBUser = Depends(get_current_student_user), db: Session = Depends(get_db)):
    return {"blanks": check_blank(db, session_id, current_user.id, blank_id, payload.answer)}

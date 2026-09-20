from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from .dopelniacz import router as dopelniacz_router
from .numerators import router as numerators_router
from .mianownik import router as mianownik_router
from models.exercise import Exercise
from models.user import User as DBUser
from services.auth import get_current_student_user
from services.database import get_db
from services.exercises import (
    apply_session_action,
    check_blank,
    create_session as create_session_state,
    exercise_detail,
    get_session,
    restart_session,
)
from schemas.exercises import BlankCheckRequest, LearnerCatalogItem, LearnerExerciseResponse, SessionActionRequest

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
    return create_session_state(db, slug, current_user.id)


@router.get("/{slug}/sessions/{session_id}", tags=["exercises"])
async def get_session_state(slug: str, session_id: str, current_user: DBUser = Depends(get_current_student_user), db: Session = Depends(get_db)):
    return get_session(db, slug, session_id, current_user.id)


@router.post("/{slug}/sessions/{session_id}/actions", tags=["exercises"])
async def session_action(slug: str, session_id: str, payload: SessionActionRequest, current_user: DBUser = Depends(get_current_student_user), db: Session = Depends(get_db)):
    return apply_session_action(db, slug, session_id, current_user.id, payload.model_dump())


@router.post("/{slug}/sessions/{session_id}/restart", tags=["exercises"])
async def restart_session_state(slug: str, session_id: str, current_user: DBUser = Depends(get_current_student_user), db: Session = Depends(get_db)):
    return restart_session(db, slug, session_id, current_user.id)


session_router = APIRouter(prefix="/api/exercise-sessions", dependencies=[Depends(get_current_student_user)])


@session_router.post("/{session_id}/blanks/{blank_id}/check", tags=["exercises"])
async def check_session_blank(session_id: str, blank_id: str, payload: BlankCheckRequest, current_user: DBUser = Depends(get_current_student_user), db: Session = Depends(get_db)):
    return {"blanks": check_blank(db, session_id, current_user.id, blank_id, payload.answer)}

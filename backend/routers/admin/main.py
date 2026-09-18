from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models.exercise import Exercise
from models.user import User
from routers.admin import rules
from schemas.exercises import ExerciseCreate, ExerciseUpdate
from services.auth import get_current_admin_user
from services.database import get_db
from services.exercises import list_types, validate_definition

router = APIRouter(prefix="/admin", dependencies=[Depends(get_current_admin_user)])
router.include_router(rules.router)


def serialize(exercise: Exercise) -> dict:
    return {"id": exercise.id, "slug": exercise.slug, "type_code": exercise.type_code, "schema_version": exercise.schema_version, "title": exercise.title, "description": exercise.description, "instruction": exercise.instruction, "difficulty": exercise.difficulty, "estimated_duration_minutes": exercise.estimated_duration_minutes, "display_order": exercise.display_order, "status": exercise.status, "definition": exercise.definition}


@router.get("/exercise-types", tags=["admin"])
async def exercise_types(current_user: User = Depends(get_current_admin_user)):
    return list_types()


@router.get("/exercises", tags=["admin"])
async def list_exercises(current_user: User = Depends(get_current_admin_user), db: Session = Depends(get_db)):
    rows = db.query(Exercise).order_by(Exercise.display_order, Exercise.id).all()
    return [{key: getattr(row, key) for key in ("id", "slug", "title", "type_code", "schema_version", "status", "display_order")} for row in rows]


@router.post("/exercises", status_code=status.HTTP_201_CREATED, tags=["admin"])
async def create_exercise(payload: ExerciseCreate, current_user: User = Depends(get_current_admin_user), db: Session = Depends(get_db)):
    definition = validate_definition(payload.type_code, payload.schema_version, payload.definition)
    exercise = Exercise(**payload.model_dump(exclude={"definition"}), definition=definition)
    db.add(exercise)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=409, detail="Упражнение с таким slug уже существует") from error
    db.refresh(exercise)
    return serialize(exercise)


@router.get("/exercises/{exercise_id}", tags=["admin"])
async def get_exercise(exercise_id: int, current_user: User = Depends(get_current_admin_user), db: Session = Depends(get_db)):
    exercise = db.get(Exercise, exercise_id)
    if exercise is None:
        raise HTTPException(status_code=404, detail="Упражнение не найдено")
    return serialize(exercise)


@router.put("/exercises/{exercise_id}", tags=["admin"])
async def update_exercise(exercise_id: int, payload: ExerciseUpdate, current_user: User = Depends(get_current_admin_user), db: Session = Depends(get_db)):
    exercise = db.get(Exercise, exercise_id)
    if exercise is None:
        raise HTTPException(status_code=404, detail="Упражнение не найдено")
    definition = validate_definition(exercise.type_code, exercise.schema_version, payload.definition)
    for field, value in payload.model_dump(exclude={"definition"}).items():
        setattr(exercise, field, value)
    exercise.definition = definition
    db.commit()
    db.refresh(exercise)
    return serialize(exercise)

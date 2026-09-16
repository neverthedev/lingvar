from fastapi import APIRouter, Depends
from .dopelniacz import router as dopelniacz_router
from .numerators import router as numerators_router
from .mianownik import router as mianownik_router
from .catalog import full_exercise_catalog
from models.user import User as DBUser
from services.auth import get_current_student_user

# Main exercises router
router = APIRouter(
    prefix="/api/exercises",
    dependencies=[Depends(get_current_student_user)],
)

# Include sub-routers
router.include_router(dopelniacz_router)
router.include_router(numerators_router)
router.include_router(mianownik_router)

@router.get("/", tags=["exercises"])
async def exercises_root(
    current_user: DBUser = Depends(get_current_student_user)
):
    """
    Exercises root endpoint - requires authentication
    """

    return full_exercise_catalog()

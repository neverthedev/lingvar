from fastapi import APIRouter, Depends
from .dopelniacz import router as dopelniacz_router
from .numerators import router as numerators_router
from models.user import User as DBUser
from services.auth import get_current_active_user

# Main exercises router
router = APIRouter(prefix="/api/exercises")

# Include sub-routers
router.include_router(dopelniacz_router)
router.include_router(numerators_router)

@router.get("/", tags=["exercises"])
async def exercises_root(
    current_user: DBUser = Depends(get_current_active_user)
):
    """
    Exercises root endpoint - requires authentication
    """

    data = [
      {
        "id": "dopelniacz",
        "title": "Dopełniacz (Genitive Case)",
        "description": "Practice identifying and using singular nouns in different contexts. Learn the basics of noun usage.",
        "api": "/api/exercises/dopelniacz",
        "difficulty": "Beginner",
        "duration": "15 min"
      },
      {
        "id": "numerators",
        "title": "Liczebniki (Numerals)",
        "description": "Practice Polish numerals and their Russian translations. Learn different forms of numbers.",
        "api": "/api/exercises/numerators",
        "difficulty": "Beginner",
        "duration": "10 min"
      }
    ]
    return data

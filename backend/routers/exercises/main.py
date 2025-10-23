from fastapi import APIRouter, Depends
from .dopelniacz import router as dopelniacz_router
from .numerators import router as numerators_router
from .mianownik import router as mianownik_router
from models.user import User as DBUser
from services.auth import get_current_active_user

# Main exercises router
router = APIRouter(prefix="/api/exercises")

# Include sub-routers
router.include_router(dopelniacz_router)
router.include_router(numerators_router)
router.include_router(mianownik_router)

@router.get("/", tags=["exercises"])
async def exercises_root(
    current_user: DBUser = Depends(get_current_active_user)
):
    """
    Exercises root endpoint - requires authentication
    """

    data = [
      {
        "id": "dopelniacz-pojed",
        "title": "Dopełniacz (Genitive Case) Liczby Pojedynczej",
        "description": "Practice identifying and using singular nouns in different contexts. Learn the basics of noun usage.",
        "api": "/api/exercises/dopelniacz/pojed",
        "difficulty": "Beginner",
        "duration": "15 min"
      },
      {
        "id": "dopelniacz-mnoga",
        "title": "Dopełniacz (Genitive Case) Liczby Mnogiej",
        "description": "Practice identifying and using plural nouns in different contexts. Learn the basics of noun usage.",
        "api": "/api/exercises/dopelniacz/mnoga",
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
      },
      {
        "id": "mianowniki-mnoga",
        "title": "Mianownik Liczny Mnogej",
        "description": "Practice Polish nouns in nominative plural case with their Russian translations. Learn different forms of plural nouns.",
        "api": "/api/exercises/mianowniki/mnoga",
        "difficulty": "Beginner",
        "duration": "10 min"
      }


    ]
    return data

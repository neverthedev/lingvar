from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import os

from services.database import get_db, test_connection
from models.user import User as DBUser
from services.auth import get_current_student_user

router = APIRouter(
    prefix="/api",
    tags=["misc"],
    responses={404: {"description": "Not found"}},
)

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    db_status = "connected" if test_connection() else "disconnected"
    return {
        "status": "healthy",
        "service": "lingvar-backend",
        "database": db_status,
        "auth": "enabled"
    }

@router.get("/db-test")
async def test_database_connection(
    current_user: DBUser = Depends(get_current_student_user),
    db: Session = Depends(get_db)
):
    """Database connection test endpoint"""
    try:
        user_count = db.query(DBUser).count()
        return {
            "status": "connected",
            "users_count": user_count,
            "database_type": "PostgreSQL" if "postgresql" in os.getenv('DATABASE_URL', '') else "SQLite",
            "current_user": current_user.username
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

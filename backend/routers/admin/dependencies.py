from fastapi import HTTPException, Depends, status
from sqlalchemy.orm import Session
from services.auth import get_current_user
from services.database import get_db
from models.user import User

def get_admin_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to ensure the current user has admin privileges.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

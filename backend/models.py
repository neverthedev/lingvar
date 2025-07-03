from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Annotated
from datetime import datetime

# User models
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: Annotated[str, Field(min_length=8)]

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_superuser: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None

# Authentication models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

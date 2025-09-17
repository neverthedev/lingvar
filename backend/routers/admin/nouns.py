from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from services.database import get_db
from models.vocabulary import Noun
from models.user import User
from .dependencies import get_admin_user

router = APIRouter(prefix="/nouns", tags=["admin-nouns"])


# Request/Response Models
class NounCreate(BaseModel):
    word: str
    gender: str
    cases_pojed: dict
    cases_mnoga: dict


class NounUpdate(BaseModel):
    word: Optional[str] = None
    gender: Optional[str] = None
    cases_pojed: Optional[dict] = None
    cases_mnoga: Optional[dict] = None


class NounResponse(BaseModel):
    id: int
    word: str
    gender: str
    cases_pojed: dict
    cases_mnoga: dict

    class Config:
        from_attributes = True


class NounListResponse(BaseModel):
    total: int
    nouns: List[NounResponse]


@router.get("/", response_model=NounListResponse)
async def list_nouns(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    search: Optional[str] = Query(None, description="Search by word"),
    gender: Optional[str] = Query(None, description="Filter by gender"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user)
):
    """
    List all nouns with pagination and filtering options.
    Admin access required.
    """
    query = db.query(Noun)

    # Apply filters
    if search:
        query = query.filter(Noun.word.ilike(f"%{search}%"))

    if gender:
        query = query.filter(Noun.gender == gender)

    # Get total count for pagination
    total = query.count()

    # Apply pagination
    nouns = query.offset(skip).limit(limit).all()

    return NounListResponse(total=total, nouns=nouns)


@router.get("/{noun_id}", response_model=NounResponse)
async def get_noun(
    noun_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user)
):
    """
    Get a specific noun by ID.
    Admin access required.
    """
    noun = db.query(Noun).filter(Noun.id == noun_id).first()
    if not noun:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Noun not found"
        )
    return noun


@router.post("/", response_model=NounResponse, status_code=status.HTTP_201_CREATED)
async def create_noun(
    noun_data: NounCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user)
):
    """
    Create a new noun.
    Admin access required.
    """
    # Check if noun with the same word already exists
    existing_noun = db.query(Noun).filter(Noun.word == noun_data.word).first()
    if existing_noun:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Noun with word '{noun_data.word}' already exists"
        )

    # Create new noun
    noun = Noun(
        word=noun_data.word,
        gender=noun_data.gender,
        cases_pojed=noun_data.cases_pojed,
        cases_mnoga=noun_data.cases_mnoga
    )

    db.add(noun)
    db.commit()
    db.refresh(noun)

    return noun


@router.put("/{noun_id}", response_model=NounResponse)
async def update_noun(
    noun_id: int,
    noun_data: NounUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user)
):
    """
    Update an existing noun.
    Admin access required.
    """
    noun = db.query(Noun).filter(Noun.id == noun_id).first()
    if not noun:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Noun not found"
        )

    # Update only provided fields
    update_data = noun_data.dict(exclude_unset=True)

    # Check if word is being updated and if it conflicts with existing noun
    if "word" in update_data and update_data["word"] != noun.word:
        existing_noun = db.query(Noun).filter(Noun.word == update_data["word"]).first()
        if existing_noun:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Noun with word '{update_data['word']}' already exists"
            )

    for field, value in update_data.items():
        setattr(noun, field, value)

    db.commit()
    db.refresh(noun)

    return noun


@router.delete("/{noun_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_noun(
    noun_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user)
):
    """
    Delete a noun.
    Admin access required.
    """
    noun = db.query(Noun).filter(Noun.id == noun_id).first()
    if not noun:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Noun not found"
        )

    db.delete(noun)
    db.commit()

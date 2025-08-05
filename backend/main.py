from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import timedelta
from contextlib import asynccontextmanager
import uvicorn
import os

from database import get_db, create_tables, User as DBUser, test_connection, Noun
from auth import authenticate_user, create_access_token, get_current_active_user, get_password_hash, ACCESS_TOKEN_EXPIRE_MINUTES
from models import UserCreate, UserResponse, Token
from lib.polish_declension_scraper import PolishDeclensionScraper

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting up...")
    print(f"Database URL: {os.getenv('DATABASE_URL', 'sqlite:///./lingvar.db')}")
    if test_connection():
        print("Database connection successful!")
        create_tables()
        print("Database tables created/verified!")
    else:
        print("Database connection failed!")

    yield

    # Shutdown (if needed)
    print("Shutting down...")

app = FastAPI(
    title="Lingvar Backend API",
    description="FastAPI backend for Lingvar application",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware to allow requests from Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8087", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    print("Root endpoint accessed")
    return {"message": "Welcome to Lingvar FastAPI Backend with Authentication"}

@app.get("/health")
async def health_check():
    db_status = "connected" if test_connection() else "disconnected"
    return {
        "status": "healthy",
        "service": "lingvar-backend",
        "database": db_status,
        "auth": "enabled"
    }

# Authentication endpoints
@app.post("/register", response_model=UserResponse)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(DBUser).filter(
        (DBUser.username == user.username) | (DBUser.email == user.email)
    ).first()
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Username or email already registered"
        )

    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = DBUser(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: DBUser = Depends(get_current_active_user)):
    return current_user

@app.get("/users", response_model=list[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    current_user: DBUser = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    users = db.query(DBUser).offset(skip).limit(limit).all()
    return users

# Database connection test endpoint
@app.get("/api/db-test")
async def test_database_connection(
    current_user: DBUser = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
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

# Polish declension endpoint
@app.get("/api/declension/ludzie")
async def get_ludzie_declension(current_user: DBUser = Depends(get_current_active_user)):
    """Get Polish declension for the word 'ludzie'"""
    scraper = PolishDeclensionScraper()
    result = scraper.get_ludzie_declension()

    if not result:
        raise HTTPException(
            status_code=500,
            detail="Failed to scrape declension data"
        )

    return scraper.format_declension_result(result)

# Endpoint to get 20 random nouns with their single cases (flat JSON)
@app.get("/api/nouns/single", tags=["nouns"])
async def get_nouns_page(
    current_user: DBUser = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    nouns = db.query(Noun).order_by(func.random()).limit(20).all()
    # Define all possible cases (adjust as needed for your language)
    all_cases = [ "mianownik", "dopełniacz", "celownik", "biernik", "narzędnik", "miejscownik", "wołacz" ]
    result = []
    for noun in nouns:
        # Start with all cases as empty string
        flat = {"id": noun.id, "word": noun.word}
        for case in all_cases:
            flat[case] = ""
        # Merge actual cases_pojed values if present
        if isinstance(noun.cases_pojed, dict):
            flat.update(noun.cases_pojed)
        result.append(flat)
    return result

@app.get("/api/pronouns/", tags=["pronouns"])
async def get_pronouns(
    current_user: DBUser = Depends(get_current_active_user)
):
    """Get Polish pronouns"""
    all_cases = ["mianownik", "dopełniacz", "celownik", "biernik", "narzędnik", "miejscownik", "wołacz"]

    # Polish pronouns with their declensions
    pronouns_data = [
        {
            "id": 1,
            "word": "ja",
            "mianownik": "ja",
            "dopełniacz": "mnie",
            "celownik": "mi",
            "biernik": "mnie",
            "narzędnik": "mną",
            "miejscownik": "mnie",
            "wołacz": ""
        },
        {
            "id": 2,
            "word": "ty",
            "mianownik": "ty",
            "dopełniacz": "ciebie",
            "celownik": "ci",
            "biernik": "ciebie",
            "narzędnik": "tobą",
            "miejscownik": "tobie",
            "wołacz": "ty"
        },
        {
            "id": 3,
            "word": "on",
            "mianownik": "on",
            "dopełniacz": "jego",
            "celownik": "jemu",
            "biernik": "jego",
            "narzędnik": "nim",
            "miejscownik": "nim",
            "wołacz": ""
        },
        {
            "id": 4,
            "word": "ona",
            "mianownik": "ona",
            "dopełniacz": "jej",
            "celownik": "jej",
            "biernik": "ją",
            "narzędnik": "nią",
            "miejscownik": "niej",
            "wołacz": ""
        },
        {
            "id": 5,
            "word": "ono",
            "mianownik": "ono",
            "dopełniacz": "jego",
            "celownik": "jemu",
            "biernik": "je",
            "narzędnik": "nim",
            "miejscownik": "nim",
            "wołacz": ""
        },
        {
            "id": 6,
            "word": "my",
            "mianownik": "my",
            "dopełniacz": "nas",
            "celownik": "nam",
            "biernik": "nas",
            "narzędnik": "nami",
            "miejscownik": "nas",
            "wołacz": ""
        },
        {
            "id": 7,
            "word": "wy",
            "mianownik": "wy",
            "dopełniacz": "was",
            "celownik": "wam",
            "biernik": "was",
            "narzędnik": "wami",
            "miejscownik": "was",
            "wołacz": "wy"
        },
        {
            "id": 8,
            "word": "oni",
            "mianownik": "oni",
            "dopełniacz": "ich",
            "celownik": "im",
            "biernik": "ich",
            "narzędnik": "nimi",
            "miejscownik": "nich",
            "wołacz": ""
        },
        {
            "id": 9,
            "word": "one",
            "mianownik": "one",
            "dopełniacz": "ich",
            "celownik": "im",
            "biernik": "je",
            "narzędnik": "nimi",
            "miejscownik": "nich",
            "wołacz": ""
        }
    ]

    # Ensure all cases are present with empty string defaults
    result = []
    for pronoun in pronouns_data:
        flat = {"id": pronoun["id"], "word": pronoun["word"]}
        for case in all_cases:
            flat[case] = pronoun.get(case, "")
        result.append(flat)
    return result

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

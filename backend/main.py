from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from contextlib import asynccontextmanager
import uvicorn
import os

from database import get_db, create_tables, User as DBUser, test_connection
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

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

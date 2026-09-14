from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import os

from services.database import create_tables, test_connection
from routers import users, nouns, pronouns, verbs, misc, tests
from routers.admin import main as admin
from routers.exercises import main as exercises

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
    allow_origins=["http://localhost:8087", "http://192.168.60.146:8087"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    print("Root endpoint accessed")
    return {"message": "Welcome to Lingvar FastAPI Backend with Authentication"}

# Include all routers
app.include_router(users.router)
app.include_router(nouns.router)
app.include_router(pronouns.router)
app.include_router(verbs.router)
app.include_router(tests.router)
app.include_router(misc.router)
app.include_router(exercises.router)
app.include_router(admin.router)

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

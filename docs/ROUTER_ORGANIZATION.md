# Backend Router Organization

This backend has been reorganized following FastAPI best practices for larger applications as described in the [FastAPI documentation](https://fastapi.tiangolo.com/tutorial/bigger-applications/).

## File Structure

```
backend/
├── main.py                 # Main FastAPI application
├── database.py            # Database connection and setup
├── models.py              # Compatibility layer for model imports
├── models/                # ✨ Data models directory
│   ├── __init__.py
│   ├── user.py            # User-related models (Pydantic + SQLAlchemy)
│   ├── token.py           # Authentication token models
│   └── vocabulary.py      # Vocabulary models (Noun, etc.)
├── services/              # Business logic services
│   ├── __init__.py
│   └── auth.py            # Authentication service
├── routers/               # API route modules
│   ├── __init__.py
│   ├── users.py           # User authentication and management
│   ├── nouns.py           # Noun-related endpoints
│   ├── pronouns.py        # Pronoun endpoints
│   └── misc.py           # Miscellaneous endpoints (health, db-test, declension)
└── lib/                  # Library modules
    └── polish_declension_scraper.py
```

## Routers

### Users Router (`/users`)
- `POST /users/register` - User registration
- `POST /users/token` - User authentication/login
- `GET /users/me` - Get current user info
- `GET /users/` - Get all users (protected)

### Nouns Router (`/api/nouns`)
- `GET /api/nouns/single` - Get 20 random nouns with single cases
- `GET /api/nouns/plural` - Get 20 random nouns with plural cases (stub)
- `GET /api/nouns/` - Get all nouns with pagination (stub)

### Pronouns Router (`/api/pronouns`)
- `GET /api/pronouns/` - Get Polish pronouns with declensions

### Misc Router (`/api`)
- `GET /api/health` - Health check endpoint
- `GET /api/db-test` - Database connection test (protected)
- `GET /api/declension/ludzie` - Polish declension for "ludzie" (protected)

## Security

All endpoints except `/`, `/api/health`, `/users/register`, and `/users/token` require authentication via JWT Bearer token.

## Tags in OpenAPI Documentation

The endpoints are organized with the following tags:
- `users` - User management endpoints
- `nouns` - Noun-related endpoints
- `pronouns` - Pronoun endpoints
- `misc` - Miscellaneous utilities

## Usage

1. Start the application: `python main.py`
2. Visit the interactive API documentation at `http://localhost:8000/docs`
3. Register a user via `POST /users/register`
4. Get a token via `POST /users/token`
5. Use the token to access protected endpoints

## Benefits of This Organization

1. **Separation of Concerns**: Each router handles a specific domain
2. **Service Layer**: Authentication logic is encapsulated in services/
3. **Model Organization**: Data models are organized by domain in models/
4. **Scalability**: Easy to add new routers, services, models, and endpoints
5. **Maintainability**: Related functionality is grouped together
6. **Clear Documentation**: OpenAPI docs are well-organized with tags
7. **Dependency Management**: Common dependencies are handled at router level
8. **Security**: Authentication requirements are clearly defined per router
9. **Backward Compatibility**: Old imports still work through models.py

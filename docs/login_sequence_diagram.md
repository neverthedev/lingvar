# Login Process Flow - Lingvar Backend

## Sequence Diagram

```mermaid
sequenceDiagram
    participant Client as Frontend Client
    participant API as FastAPI Backend
    participant Auth as Auth Module
    participant DB as Database
    participant JWT as JWT Token

    Note over Client,JWT: User Login Process

    Client->>API: POST /token (username, password)
    API->>Auth: authenticate_user(db, username, password)
    Auth->>DB: Query user by username
    DB-->>Auth: Return user record
    Auth->>Auth: verify_password(password, hashed_password)

    alt Authentication Success
        Auth-->>API: Return authenticated user
        API->>JWT: create_access_token({"sub": username})
        JWT-->>API: Return JWT token
        API-->>Client: {"access_token": token, "token_type": "bearer"}
    else Authentication Failed
        Auth-->>API: Return None/False
        API-->>Client: HTTP 401 Unauthorized
    end

    Note over Client,JWT: Protected Endpoint Access

    Client->>API: GET /users/me (Authorization: Bearer token)
    API->>Auth: get_current_active_user(token)
    Auth->>JWT: decode_jwt_token(token)

    alt Valid Token
        JWT-->>Auth: Return decoded payload
        Auth->>DB: Get user by username from payload
        DB-->>Auth: Return user data
        Auth-->>API: Return current user
        API-->>Client: User profile data
    else Invalid Token
        Auth-->>API: Raise HTTP 401
        API-->>Client: HTTP 401 Unauthorized
    end
```

## Flow Description

1. **Login Request**: Client sends username/password to `/token` endpoint
2. **User Authentication**: Backend queries database and verifies password hash
3. **Token Generation**: If valid, creates JWT token with user identity
4. **Token Response**: Returns access token to client
5. **Protected Access**: Client uses token in Authorization header for protected endpoints
6. **Token Validation**: Backend validates token and extracts user identity for each request

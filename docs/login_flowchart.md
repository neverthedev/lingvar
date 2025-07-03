# Login Process Flowchart - Lingvar Backend

## Login Flow Decision Chart

```mermaid
flowchart TD
    A[User enters credentials] --> B[POST /token request]
    B --> C{Username exists in DB?}

    C -->|No| D[Return 401 Unauthorized]
    C -->|Yes| E[Verify password hash]

    E --> F{Password valid?}
    F -->|No| D
    F -->|Yes| G[Generate JWT token]

    G --> H[Return token to client]
    H --> I[Client stores token]

    I --> J[Client makes authenticated request]
    J --> K[Send token in Authorization header]
    K --> L{Token valid?}

    L -->|No| M[Return 401 Unauthorized]
    L -->|Yes| N[Decode token payload]

    N --> O[Extract username from token]
    O --> P[Query user from DB]
    P --> Q{User exists and active?}

    Q -->|No| M
    Q -->|Yes| R[Return protected resource]

    style A fill:#e1f5fe
    style D fill:#ffebee
    style M fill:#ffebee
    style R fill:#e8f5e8
    style H fill:#e8f5e8
```

## Authentication States

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated

    Unauthenticated --> Authenticating: Login attempt
    Authenticating --> Authenticated: Valid credentials
    Authenticating --> Unauthenticated: Invalid credentials

    Authenticated --> AccessingResource: Request protected endpoint
    AccessingResource --> Authenticated: Valid token
    AccessingResource --> Unauthenticated: Invalid/expired token

    Authenticated --> Unauthenticated: Logout/Token expires
```

## Key Decision Points

1. **Username Validation**: Check if user exists in database
2. **Password Verification**: Compare provided password with stored hash
3. **Token Generation**: Create JWT with user identity and expiration
4. **Token Validation**: Verify token signature and expiration on each request
5. **User Status Check**: Ensure user account is still active

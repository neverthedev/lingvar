# LingVar Frontend - Authentication Implementation

This document describes the authentication system implemented for the LingVar language learning platform.

## Overview

The authentication system includes:
- User registration (signup)
- User login
- Protected routes
- JWT token management
- User profile display
- Logout functionality

## API Integration

The frontend integrates with the FastAPI backend at `http://localhost:8000` using the following endpoints:

### Authentication Endpoints
- `POST /register` - User registration
- `POST /token` - User login (returns JWT access token)
- `GET /users/me` - Get current user profile

### Request/Response Formats

#### Registration
```json
// Request
{
  "username": "string",
  "email": "string",
  "password": "string"
}

// Response
{
  "id": 1,
  "username": "string",
  "email": "string",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### Login
```
// Request (form-encoded)
username=string&password=string

// Response
{
  "access_token": "string",
  "token_type": "bearer"
}
```

## File Structure

```
src/
├── app/
│   ├── login/
│   │   └── page.tsx          # Login page
│   ├── signup/
│   │   └── page.tsx          # Signup page
│   ├── layout.tsx            # Root layout with AuthProvider
│   └── page.tsx              # Home page with auth status
├── components/
│   └── Navigation.tsx        # Navigation bar with login/logout
├── contexts/
│   └── AuthContext.tsx       # Authentication context and state
├── lib/
│   └── api.ts                # API utilities and service functions
└── middleware.ts             # Route protection middleware
```

## Key Features

### 1. Authentication Context (`AuthContext.tsx`)
- Manages global authentication state
- Provides login/logout functions
- Handles token storage and user data
- Automatically checks authentication status on app load

### 2. API Service (`api.ts`)
- Centralized API configuration
- Type-safe API functions
- Automatic token handling for authenticated requests
- Error handling and token refresh logic

### 3. Protected Routes (`middleware.ts`)
- Automatically redirects unauthenticated users to login
- Prevents authenticated users from accessing login/signup pages
- Configurable protected paths

### 4. User Interface
- Clean, modern design using Tailwind CSS
- Responsive layout for mobile and desktop
- Loading states and error handling
- Success messages and form validation

## Usage

### Starting the Application

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Ensure the backend API is running at `http://localhost:8000`

### User Flow

1. **New User**: Visit `/signup` to create an account
2. **Existing User**: Visit `/login` to sign in
3. **Authenticated User**: Access protected features and see profile info
4. **Logout**: Click logout button in navigation

### Token Management

- JWT tokens are stored in localStorage
- Tokens are automatically included in API requests
- Invalid/expired tokens trigger automatic logout
- Token refresh logic can be extended as needed

## Security Considerations

### Current Implementation
- JWT tokens stored in localStorage (suitable for development)
- HTTPS should be used in production
- CORS properly configured on backend

### Production Recommendations
- Use httpOnly cookies for token storage
- Implement token refresh mechanism
- Add CSRF protection
- Use secure session management
- Implement rate limiting

## Customization

### Adding Protected Routes
Add paths to the `protectedPaths` array in `middleware.ts`:
```typescript
const protectedPaths = ['/dashboard', '/profile', '/settings', '/new-route']
```

### Modifying API Base URL
Update the `API_BASE_URL` in `src/lib/api.ts`:
```typescript
export const API_BASE_URL = 'https://your-production-api.com'
```

### Styling
The UI uses Tailwind CSS classes. Customize the design by modifying the className attributes in the components.

## Troubleshooting

### Common Issues

1. **"Cannot find module 'autoprefixer'"**
   - Run `npm install` to install dependencies
   - Ensure `autoprefixer` is in `package.json` devDependencies

2. **CORS Errors**
   - Ensure backend allows requests from frontend origin
   - Check CORS configuration on FastAPI backend

3. **Token Issues**
   - Clear localStorage and login again
   - Check if backend is running and accessible
   - Verify API endpoint URLs are correct

4. **Network Errors**
   - Ensure backend is running on port 8000
   - Check if API endpoints are responding
   - Verify network connectivity

## Next Steps

Potential enhancements:
- Password reset functionality
- Email verification
- Social login integration
- Two-factor authentication
- Remember me functionality
- User profile editing
- Admin dashboard

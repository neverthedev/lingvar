// API configuration
export const API_BASE_URL = 'http://localhost:8000'
// export const API_BASE_URL = 'http://192.168.60.146:8000'

// API endpoints
export const API_ENDPOINTS = {
  register: `${API_BASE_URL}/users/register`,
  login: `${API_BASE_URL}/users/token`,
  userMe: `${API_BASE_URL}/users/me`,
  users: `${API_BASE_URL}/users/`,
  health: `${API_BASE_URL}/api/health`,
  dbTest: `${API_BASE_URL}/api/db-test`,
  declensionLudzie: `${API_BASE_URL}/api/declension/ludzie`,
  nounsSingle: `${API_BASE_URL}/api/nouns/single`,
  pronouns: `${API_BASE_URL}/api/pronouns/`,
  verbs: `${API_BASE_URL}/api/verbs/`,
  exercises: `${API_BASE_URL}/api/exercises/`,
  adminExercises: `${API_BASE_URL}/admin/exercises`,
  testsAttempt: `${API_BASE_URL}/api/tests/attempt`,
  testsComplete: `${API_BASE_URL}/api/tests/complete`,
  testsWeight: `${API_BASE_URL}/api/tests/weight`
}

// Types based on the API documentation
export interface UserCreate {
  username: string
  email: string
  password: string
}

export interface UserResponse {
  id: number
  username: string
  email: string
  is_active: boolean
  is_superuser: boolean
  created_at: string
}

export interface Token {
  access_token: string
  token_type: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface ExerciseMetadata {
  id: string
  title: string
}

// Authentication utilities
export class AuthService {
  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token')
    }
    return null
  }

  static getTokenType(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token_type')
    }
    return null
  }

  static setTokens(accessToken: string, tokenType: string = 'Bearer'): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', accessToken)
      localStorage.setItem('token_type', tokenType)
    }
  }

  static clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('token_type')
    }
  }

  static isAuthenticated(): boolean {
    return this.getToken() !== null
  }

  static getAuthHeaders(): Record<string, string> {
    const token = this.getToken()
    const tokenType = this.getTokenType()

    if (token && tokenType) {
      return {
        'Authorization': `${tokenType} ${token}`,
        'Content-Type': 'application/json'
      }
    }

    return {
      'Content-Type': 'application/json'
    }
  }
}

// API call functions
export class ApiService {
  static async register(userData: UserCreate): Promise<UserResponse> {
    let response: Response

    try {
      response = await fetch(API_ENDPOINTS.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      })
    } catch {
      throw new Error('Unable to reach the registration service. Please try again later.')
    }

    if (!response.ok) {
      let detail: unknown

      try {
        const errorData: unknown = await response.json()
        if (typeof errorData === 'object' && errorData !== null && 'detail' in errorData) {
          detail = errorData.detail
        }
      } catch {
        // Use the user-facing fallback below for non-JSON error responses.
      }

      if (detail === 'Username or email already registered') {
        throw new Error('This username or email is already registered.')
      }

      if (typeof detail === 'string' && detail.trim()) {
        throw new Error(detail)
      }

      throw new Error('We could not create your account. Please check your details and try again.')
    }

    try {
      return await response.json()
    } catch {
      throw new Error('The registration service returned an invalid response. Please try signing in or try again later.')
    }
  }

  static async login(credentials: LoginCredentials): Promise<Token> {
    const formBody = new URLSearchParams()
    formBody.append('username', credentials.username)
    formBody.append('password', credentials.password)

    const response = await fetch(API_ENDPOINTS.login, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody.toString()
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Login failed')
    }

    return response.json()
  }

  static async getCurrentUser(): Promise<UserResponse> {
    const response = await fetch(API_ENDPOINTS.userMe, {
      method: 'GET',
      headers: AuthService.getAuthHeaders()
    })

    if (!response.ok) {
      if (response.status === 401) {
        AuthService.clearTokens()
        throw new Error('Unauthorized')
      }
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Failed to fetch user data')
    }

    return response.json()
  }

  static async getUsers(): Promise<UserResponse[]> {
    const response = await fetch(API_ENDPOINTS.users, {
      method: 'GET',
      headers: AuthService.getAuthHeaders()
    })

    if (!response.ok) {
      if (response.status === 401) {
        AuthService.clearTokens()
        throw new Error('Unauthorized')
      }
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Failed to fetch users')
    }

    return response.json()
  }

  static async getAdminExercises(): Promise<ExerciseMetadata[]> {
    const response = await fetch(API_ENDPOINTS.adminExercises, {
      method: 'GET',
      headers: AuthService.getAuthHeaders()
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      const detail = errorData && typeof errorData === 'object' && 'detail' in errorData
        ? errorData.detail
        : null
      throw new Error(typeof detail === 'string' ? detail : 'Failed to fetch exercises')
    }

    return response.json()
  }
}

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
  exerciseSessions: `${API_BASE_URL}/api/exercise-sessions`,
  adminExercises: `${API_BASE_URL}/admin/exercises`,
  adminExerciseTypes: `${API_BASE_URL}/admin/exercise-types`,
  adminRules: `${API_BASE_URL}/admin/rules`,
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

export type ExerciseTypeCode = 'form_table' | 'single_input' | 'self_check' | 'fill_blanks'
export interface ExerciseCatalogItem { slug: string; title: string; description: string; difficulty: 'beginner' | 'intermediate' | 'advanced'; estimated_duration_minutes: number | null; type_code: ExerciseTypeCode }
export interface ExerciseMetadata { id: number; slug: string; title: string; type_code: ExerciseTypeCode; schema_version: number; status: 'draft' | 'published'; display_order: number }
export interface ExerciseType { code: ExerciseTypeCode; label: string; schema_version: number }
export interface ExerciseRecord extends ExerciseMetadata { description: string; instruction: string; difficulty: 'beginner' | 'intermediate' | 'advanced'; estimated_duration_minutes: number | null; definition: ExerciseDefinition }
export type ColumnDefinition = { key: string; label: string }
export type FormTableDefinition = { source_code: string; columns: ColumnDefinition[]; sample_size: number | null; max_attempts: 3 }
export type SingleInputDefinition = { source_code: string; sample_size: number | null; max_attempts: 3; reveal_after_exhaustion: true }
export type SelfCheckDefinition = { source_code: string; sample_size: number | null }
export type FillBlankPartDefinition = { kind: 'blank'; id: string; hint: string | null; accepted_answers: string[] }
export type FillTextPartDefinition = { kind: 'text'; text: string }
export type FillBlanksDefinition = { items: Array<{ id: string; parts: Array<FillBlankPartDefinition | FillTextPartDefinition> }> }
export type ExerciseDefinition = FormTableDefinition | SingleInputDefinition | SelfCheckDefinition | FillBlanksDefinition
export type ExerciseContent = { slug: string; title: string; description: string; instruction: string; difficulty: string; estimated_duration_minutes: number | null; schema_version: 1 } & (
  { type_code: 'form_table'; content: { columns: ColumnDefinition[]; max_attempts: 3; statistics_word_type: string; rows: Array<{id:number; prompt:string; answers:Record<string,string>; weight?:number}> } } |
  { type_code: 'single_input'; content: { max_attempts: 3; reveal_after_exhaustion: true; items: Array<{id:number;prompt:string;answer:string}> } } |
  { type_code: 'self_check'; content: { items: Array<{id:number;prompt:string;answer:string}> } } |
  { type_code: 'fill_blanks'; content: { items: Array<{id:string;parts:Array<{kind:'text';text:string}|{kind:'blank';id:string;hint:string|null}>}> } }
)

export interface RuleNode {
  id: number
  title: string
  description: string
  parent_rule_id: number | null
  ordering: number | null
  children: RuleNode[]
}

export interface RulePayload {
  title: string
  description: string
  parent_rule_id: number | null
}

export interface ApiValidationIssue {
  loc?: Array<string | number>
  msg: string
  type?: string
}

export class ApiRequestError extends Error {
  constructor(message: string, public readonly issues: ApiValidationIssue[] = []) {
    super(message)
    this.name = 'ApiRequestError'
  }
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
  private static async adminRequest<T>(url: string, options: RequestInit, fallback: string): Promise<T> {
    let response: Response
    try {
      response = await fetch(url, {
        ...options,
        headers: AuthService.getAuthHeaders(),
      })
    } catch {
      throw new Error('The server is unavailable. Changes were not saved.')
    }

    if (!response.ok) {
      const errorData: unknown = await response.json().catch(() => null)
      const detail = errorData && typeof errorData === 'object' && 'detail' in errorData
        ? errorData.detail
        : null
      if (Array.isArray(detail)) {
        const issues = detail.filter((item): item is ApiValidationIssue => typeof item === 'object' && item !== null && 'msg' in item && typeof item.msg === 'string')
        const message = issues.map(item => `${item.loc?.join('.') || 'definition'}: ${item.msg}`).join('\n') || fallback
        throw new ApiRequestError(message, issues)
      }
      throw new ApiRequestError(typeof detail === 'string' && detail.trim() ? detail : fallback)
    }

    if (response.status === 204) {
      return undefined as T
    }

    try {
      return await response.json() as T
    } catch {
      throw new Error('The server returned an invalid response. Changes were not saved.')
    }
  }

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

  static getAdminRules(): Promise<RuleNode[]> {
    return this.adminRequest<RuleNode[]>(API_ENDPOINTS.adminRules, { method: 'GET' }, 'Failed to fetch rules')
  }

  static createAdminRule(payload: RulePayload): Promise<RuleNode> {
    return this.adminRequest<RuleNode>(API_ENDPOINTS.adminRules, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, 'Unable to create rule. Changes were not saved.')
  }

  static updateAdminRule(ruleId: number, payload: RulePayload): Promise<RuleNode> {
    return this.adminRequest<RuleNode>(`${API_ENDPOINTS.adminRules}/${ruleId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }, 'Unable to save rule. Changes were not saved.')
  }

  static deleteAdminRule(ruleId: number): Promise<void> {
    return this.adminRequest<void>(`${API_ENDPOINTS.adminRules}/${ruleId}`, {
      method: 'DELETE',
    }, 'Unable to delete rule. Changes were not saved.')
  }

  static getAdminExerciseTypes(): Promise<ExerciseType[]> { return this.adminRequest<ExerciseType[]>(API_ENDPOINTS.adminExerciseTypes, { method: 'GET' }, 'Не удалось загрузить типы упражнений') }
  static getAdminExercise(id: number): Promise<ExerciseRecord> { return this.adminRequest<ExerciseRecord>(`${API_ENDPOINTS.adminExercises}/${id}`, { method: 'GET' }, 'Не удалось загрузить упражнение') }
  static createAdminExercise(payload: Omit<ExerciseRecord, 'id'>): Promise<ExerciseRecord> { return this.adminRequest<ExerciseRecord>(API_ENDPOINTS.adminExercises, { method: 'POST', body: JSON.stringify(payload) }, 'Не удалось создать упражнение') }
  static updateAdminExercise(id: number, payload: Omit<ExerciseRecord, 'id' | 'slug' | 'type_code' | 'schema_version'>): Promise<ExerciseRecord> { return this.adminRequest<ExerciseRecord>(`${API_ENDPOINTS.adminExercises}/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, 'Не удалось сохранить упражнение') }
  static async getExercises(): Promise<ExerciseCatalogItem[]> { return this.adminRequest<ExerciseCatalogItem[]>(API_ENDPOINTS.exercises, { method: 'GET' }, 'Не удалось загрузить каталог') }
  static async getExerciseContent(slug: string): Promise<ExerciseContent> { return this.adminRequest<ExerciseContent>(`${API_ENDPOINTS.exercises}${slug}/content`, { method: 'GET' }, 'Не удалось загрузить упражнение') }
}

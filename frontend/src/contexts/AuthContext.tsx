'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { UserResponse, AuthService, ApiService } from '@/lib/api'
import { RoleRouteGuard } from '@/components/RoleRouteGuard'

interface AuthContextType {
  user: UserResponse | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<UserResponse>
  logout: () => void
  refreshUser: () => Promise<UserResponse | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = AuthService.isAuthenticated() && user !== null

  useEffect(() => {
    // Check if user is already logged in
    if (AuthService.isAuthenticated()) {
      refreshUser()
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (username: string, password: string) => {
    const tokenData = await ApiService.login({ username, password })
    AuthService.setTokens(tokenData.access_token, tokenData.token_type)
    const userData = await refreshUser()
    if (!userData) {
      throw new Error('Unable to restore the signed-in user.')
    }
    return userData
  }

  const logout = () => {
    AuthService.clearTokens()
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      setIsLoading(true)
      const userData = await ApiService.getCurrentUser()
      setUser(userData)
      return userData
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      AuthService.clearTokens()
      setUser(null)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        refreshUser
      }}
    >
      <RoleRouteGuard
        user={user}
        isAuthenticated={isAuthenticated}
        isLoading={isLoading}
      >
        {children}
      </RoleRouteGuard>
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

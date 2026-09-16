import React from 'react'
import Link from 'next/link'
import { Typography, LoadingSpinner } from '../atoms'
import { UserMenu } from '../molecules'
import { useAuth } from '@/contexts/AuthContext'

export interface NavigationProps {
  className?: string
}

export const Navigation: React.FC<NavigationProps> = ({
  className = ''
}) => {
  const { user, isAuthenticated, logout, isLoading } = useAuth()

  if (isLoading) {
    return (
      <nav className={`bg-white shadow-sm border-b ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-indigo-600">
                LingVar
              </Link>
            </div>
            <div className="flex items-center">
              <LoadingSpinner size="sm" />
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className={`bg-white shadow-sm border-b ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-indigo-600">
              LingVar
            </Link>
            {user?.is_superuser && (
              <div className="ml-6 flex items-center gap-4 text-sm font-medium">
                <Link href="/admin" className="text-gray-700 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">Администрирование</Link>
                <Link href="/admin/rules" className="text-gray-700 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">Правила</Link>
              </div>
            )}
          </div>

          <UserMenu
            user={user || undefined}
            isAuthenticated={isAuthenticated}
            onLogout={logout}
          />
        </div>
      </div>
    </nav>
  )
}

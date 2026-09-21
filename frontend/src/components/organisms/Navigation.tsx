'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon, LoadingSpinner } from '../atoms'
import { UserMenu } from '../molecules'
import { useAuth } from '@/contexts/AuthContext'

export interface NavigationProps {
  className?: string
}

export const Navigation: React.FC<NavigationProps> = ({
  className = ''
}) => {
  const { user, isAuthenticated, logout, isLoading } = useAuth()
  const pathname = usePathname()
  const exercisesActive = pathname === '/exercises' || pathname.startsWith('/exercises/')

  if (isLoading) {
    return (
      <nav className={`border-b border-gray-200 bg-white ${className}`}>
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
          <div className="flex min-h-16 justify-between">
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
    <nav className={`border-b border-gray-200 bg-white ${className}`}>
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
        <div className="flex min-h-16 flex-wrap items-stretch justify-between gap-x-4">
          <div className="flex flex-wrap items-stretch">
            <Link href="/" className="flex min-h-16 items-center text-xl font-bold text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500">
              LingVar
            </Link>
            {!user?.is_superuser && (
              <Link
                href="/exercises"
                aria-current={exercisesActive ? 'page' : undefined}
                className={`relative ml-5 flex min-h-16 items-center gap-2 px-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 sm:ml-8 ${exercisesActive ? 'text-indigo-700 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-indigo-600' : 'text-gray-700 hover:text-indigo-700'}`}
              >
                <Icon name="book" size="md" aria-hidden="true" />
                Упражнения
              </Link>
            )}
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
            className="ml-auto min-h-16"
          />
        </div>
      </div>
    </nav>
  )
}

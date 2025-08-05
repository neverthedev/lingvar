import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Navigation } from '../organisms'
import { Breadcrumb, BreadcrumbItem } from '../molecules'
import { LoadingSpinner, Typography } from '../atoms'

export interface LessonLayoutProps {
  children: React.ReactNode
  breadcrumbs?: BreadcrumbItem[]
  sidebar?: React.ReactNode
  className?: string
  error?: string
  loading?: boolean
}

export const LessonLayout: React.FC<LessonLayoutProps> = ({
  children,
  breadcrumbs,
  sidebar,
  className = '',
  error,
  loading = false
}) => {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  // Show loading spinner while authenticating or if custom loading is true
  if (isLoading || loading) {
    return <LoadingSpinner size="lg" />
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    router.push('/login')
    return null
  }

  // Show error state if error is provided
  if (error) {
    return (
      <div className={`min-h-screen bg-gray-50 ${className}`}>
        <Navigation />
        <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Typography variant="h2" className="text-red-600">{error}</Typography>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <Navigation />
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {breadcrumbs && <Breadcrumb items={breadcrumbs} />}

        <div className="flex flex-col lg:flex-row gap-8">
          {sidebar && (
            <aside className="lg:w-64 flex-shrink-0">
              {sidebar}
            </aside>
          )}

          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

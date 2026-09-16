'use client'

import { ReactNode, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { UserResponse } from '@/lib/api'

function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

function isLearningPath(pathname: string): boolean {
  return pathname === '/exercises'
    || pathname.startsWith('/exercises/')
    || pathname === '/lessons'
    || pathname.startsWith('/lessons/')
}

interface RoleRouteGuardProps {
  children: ReactNode
  user: UserResponse | null
  isAuthenticated: boolean
  isLoading: boolean
}

export function RoleRouteGuard({ children, user, isAuthenticated, isLoading }: RoleRouteGuardProps) {
  const pathname = usePathname()
  const router = useRouter()
  const onAdminPath = isAdminPath(pathname)
  const protectedPath = onAdminPath || isLearningPath(pathname)
  const redirectToLogin = !isLoading && !isAuthenticated && protectedPath
  const redirectToAdmin = !isLoading && user?.is_superuser === true && !onAdminPath
  const studentDeniedAdmin = !isLoading && isAuthenticated && !user?.is_superuser && onAdminPath

  useEffect(() => {
    if (redirectToLogin) {
      router.replace('/login')
    } else if (redirectToAdmin) {
      router.replace('/admin')
    }
  }, [redirectToAdmin, redirectToLogin, router])

  if (isLoading || redirectToLogin || redirectToAdmin) {
    return <div className="min-h-screen" aria-busy="true" />
  }

  if (studentDeniedAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access denied</h1>
          <p className="mt-3 text-gray-600">This section is available only to administrators.</p>
        </div>
      </main>
    )
  }

  return <>{children}</>
}

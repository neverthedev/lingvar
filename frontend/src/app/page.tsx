'use client'

import { useAuth } from '@/contexts/AuthContext'
import { PageLayout, Typography, Button, LoadingSpinner, Icon } from '@/components'
import Link from 'next/link'

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth()

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Typography variant="h1" weight="extrabold" align="center" className="mb-4">
            Welcome to{' '}
            <span className="text-indigo-600">LingVar</span>
          </Typography>
          <Typography variant="body" color="secondary" align="center" className="max-w-3xl mx-auto mb-8">
            A modern language learning platform that helps you master new languages through interactive exercises and personalized learning paths.
          </Typography>

          {isLoading ? (
            <div className="mt-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : !isAuthenticated ? (
            <div className="mt-8 flex justify-center space-x-4">
              <Link href="/signup">
                <Button variant="primary" size="lg">
                  Get Started
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" size="lg">
                  Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <div className="mt-8">
              <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
                <Typography variant="h3" weight="bold" className="mb-4">
                  Welcome back, {user?.username}!
                </Typography>
                <Typography variant="body" color="secondary" className="mb-4">
                  Ready to continue your language learning journey?
                </Typography>
                <div className="space-y-2">
                  <Typography variant="small" color="secondary">
                    <span className="font-medium">Email:</span> {user?.email}
                  </Typography>
                  <Typography variant="small" color="secondary">
                    <span className="font-medium">Member since:</span>{' '}
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </Typography>
                  <Typography variant="small" color="secondary">
                    <span className="font-medium">Status:</span>{' '}
                    <span className={user?.is_active ? 'text-green-600' : 'text-red-600'}>
                      {user?.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </Typography>
                </div>
                <div className="mt-4">
                  <Link href="/lessons">
                    <Button variant="primary" className="w-full">
                      Continue Learning
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <Link href="/lessons" className="block">
              <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
                <div className="text-center">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Icon name="book" size="lg" className="text-indigo-600" />
                  </div>
                  <Typography variant="h5" weight="semibold" className="mb-2">
                    Interactive Lessons
                  </Typography>
                  <Typography variant="body" color="secondary">
                    Learn through engaging interactive lessons designed to help you master grammar, vocabulary, and pronunciation.
                  </Typography>
                </div>
              </div>
            </Link>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <Typography variant="h5" weight="semibold" className="mb-2">
                  Progress Tracking
                </Typography>
                <Typography variant="body" color="secondary">
                  Monitor your learning progress with detailed analytics and personalized recommendations.
                </Typography>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Icon name="user" size="lg" className="text-indigo-600" />
                </div>
                <Typography variant="h5" weight="semibold" className="mb-2">
                  Community Learning
                </Typography>
                <Typography variant="body" color="secondary">
                  Connect with other learners, practice together, and share your learning journey.
                </Typography>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

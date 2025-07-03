'use client'

import { useAuth } from '@/contexts/AuthContext'
import Navigation from '@/components/Navigation'
import Link from 'next/link'

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            Welcome to{' '}
            <span className="text-indigo-600">LingVar</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            A modern language learning platform that helps you master new languages through interactive exercises and personalized learning paths.
          </p>

          {isLoading ? (
            <div className="mt-8">
              <div className="animate-pulse bg-gray-200 h-12 w-48 mx-auto rounded-md"></div>
            </div>
          ) : !isAuthenticated ? (
            <div className="mt-8 flex justify-center space-x-4">
              <Link
                href="/signup"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-md text-lg font-medium"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="bg-white hover:bg-gray-50 text-indigo-600 border border-indigo-600 px-8 py-3 rounded-md text-lg font-medium"
              >
                Sign In
              </Link>
            </div>
          ) : (
            <div className="mt-8">
              <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Welcome back, {user?.username}!
                </h2>
                <p className="text-gray-600 mb-4">
                  Ready to continue your language learning journey?
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Email:</span> {user?.email}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Member since:</span>{' '}
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Status:</span>{' '}
                    <span className={user?.is_active ? 'text-green-600' : 'text-red-600'}>
                      {user?.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Interactive Lessons</h3>
                <p className="text-gray-600">
                  Learn through engaging interactive lessons designed to help you master grammar, vocabulary, and pronunciation.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Progress Tracking</h3>
                <p className="text-gray-600">
                  Monitor your learning progress with detailed analytics and personalized recommendations.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Community Learning</h3>
                <p className="text-gray-600">
                  Connect with other learners, practice together, and share your learning journey.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

'use client'

import { useAuth } from '@/contexts/AuthContext'
import { PageLayout, Typography, Button, LoadingSpinner, ExerciseGrid } from '@/components'
import { ApiService, ExerciseCatalogItem } from '@/lib/api'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [exercises, setExercises] = useState<ExerciseCatalogItem[]>([])
  const [exercisesLoading, setExercisesLoading] = useState(false)
  const [exercisesError, setExercisesError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) return

    const loadExercises = async () => {
      try {
        setExercisesLoading(true)
        setExercisesError(null)
        setExercises((await ApiService.getExercises()).flatMap(group => group.exercises))
      } catch (err) {
        setExercisesError(err instanceof Error ? err.message : 'Unable to load exercises')
      } finally {
        setExercisesLoading(false)
      }
    }

    loadExercises()
  }, [isAuthenticated])

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
                  <Link href="/exercises">
                    <Button variant="primary" className="w-full">
                      Continue Learning
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {isAuthenticated && (
          <section className="mt-16" aria-labelledby="exercises-heading">
            <div id="exercises-heading">
              <Typography variant="h2" weight="bold" align="center" className="mb-8">
                Exercises
              </Typography>
            </div>

            {exercisesLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : exercisesError ? (
              <Typography variant="body" color="danger" align="center">
                {exercisesError}
              </Typography>
            ) : exercises.length > 0 ? (
              <ExerciseGrid
                exercises={exercises}
                className="max-w-4xl mx-auto"
              />
            ) : (
              <Typography variant="body" color="secondary" align="center">
                Exercises are being prepared. Please check back later.
              </Typography>
            )}
          </section>
        )}
      </div>
    </PageLayout>
  )
}

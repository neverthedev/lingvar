'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { PageLayout, ExerciseGrid, Typography, LoadingSpinner } from '@/components'
import { ApiService, ExerciseCatalogItem } from '@/lib/api'

export default function ExercisesPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [exercises, setExercises] = useState<ExerciseCatalogItem[]>([])
  const [exercisesLoading, setExercisesLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchExercises()
    }
  }, [isAuthenticated])

  const fetchExercises = async () => {
    try {
      setExercisesLoading(true)
      setError(null)

      setExercises(await ApiService.getExercises())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setExercisesLoading(false)
    }
  }

  if (isLoading || exercisesLoading) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </PageLayout>
    )
  }

  if (!isAuthenticated) {
    router.push('/login')
    return null
  }

  if (error) {
    return (
      <PageLayout>
        <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6">
          <div>
            <Typography variant="h2" color="danger" className="mb-4">
              Error Loading Exercises
            </Typography>
            <Typography variant="body" color="secondary" className="mb-6">
              {error}
            </Typography>
            <button
              onClick={fetchExercises}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6">
        <div className="mb-8 max-w-2xl">
          <Typography variant="h1" weight="extrabold" className="mb-3">
            Упражнения
          </Typography>
          <Typography variant="body" color="secondary">
            Выберите тему и начните практиковаться в польском языке.
          </Typography>
        </div>

        {exercises.length > 0 ? (
          <ExerciseGrid exercises={exercises} />
        ) : (
          <div className="text-center">
            <Typography variant="h3" className="mb-4">
              No Exercises Available
            </Typography>
            <Typography variant="body" color="secondary">
              Exercises are being prepared. Please check back later.
            </Typography>
          </div>
        )}

      </div>
    </PageLayout>
  )
}

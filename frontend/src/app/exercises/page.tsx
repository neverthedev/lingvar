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
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
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
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Typography variant="h1" weight="extrabold" align="center" className="mb-4">
            Interactive Exercises
          </Typography>
          <Typography variant="body" color="secondary" align="center" className="max-w-2xl mx-auto">
            Practice your skills with our collection of interactive exercises. Test your knowledge and track your progress.
          </Typography>
        </div>

        {exercises.length > 0 ? (
          <ExerciseGrid exercises={exercises.map(exercise => ({ id: exercise.slug, title: exercise.title, description: exercise.description, difficulty: `${exercise.difficulty[0].toUpperCase()}${exercise.difficulty.slice(1)}` as 'Beginner' | 'Intermediate' | 'Advanced', duration: exercise.estimated_duration_minutes ? `${exercise.estimated_duration_minutes} min` : undefined }))} className="max-w-4xl mx-auto" />
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

        {/* Coming Soon Section */}
        <div className="mt-16 text-center">
          <Typography variant="h2" weight="bold" align="center" className="mb-4">
            More Exercises Coming Soon
          </Typography>
          <Typography variant="body" color="secondary" align="center" className="max-w-2xl mx-auto">
            We're constantly adding new exercises to help you practice and improve your language skills.
            Check back regularly for updates on new exercises and practice sessions.
          </Typography>
        </div>
      </div>
    </PageLayout>
  )
}

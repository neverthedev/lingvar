'use client'

import { useEffect, useState } from 'react'
import { PageLayout, LoadingSpinner, Typography } from '@/components'
import { ApiService, ExerciseMetadata } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

export default function AdminPage() {
  const { user } = useAuth()
  const [exercises, setExercises] = useState<ExerciseMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.is_superuser) {
      return
    }

    const loadExercises = async () => {
      try {
        setError(null)
        setExercises(await ApiService.getAdminExercises())
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to fetch exercises')
      } finally {
        setIsLoading(false)
      }
    }

    loadExercises()
  }, [user?.is_superuser])

  return (
    <PageLayout showFooter={false}>
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <Typography variant="h1" weight="extrabold" className="mb-3">
          Exercises
        </Typography>
        <Typography variant="body" color="secondary" className="mb-8">
          Available exercise catalog
        </Typography>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <Typography variant="body" color="danger">{error}</Typography>
        ) : exercises.length === 0 ? (
          <Typography variant="body" color="secondary">No exercises are available.</Typography>
        ) : (
          <ul className="space-y-3">
            {exercises.map((exercise) => (
              <li key={exercise.id} className="rounded-lg bg-white p-4 shadow">
                <p className="font-medium text-gray-900">{exercise.title}</p>
                <p className="mt-1 text-sm text-gray-600">{exercise.id}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageLayout>
  )
}

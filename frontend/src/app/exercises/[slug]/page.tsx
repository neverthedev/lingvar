'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button, LoadingSpinner, PageLayout, Typography } from '@/components'
import { ApiService, ExerciseContent } from '@/lib/api'
import { ExerciseRenderer } from '@/components/exercises/ExerciseRenderer'

export default function ExercisePage() {
  const { slug } = useParams<{slug:string}>(); const router = useRouter()
  const [exercise, setExercise] = useState<ExerciseContent | null>(null); const [error, setError] = useState<string | null>(null)
  useEffect(() => { setExercise(null); setError(null); void ApiService.getExerciseContent(slug).then(setExercise).catch(reason => setError(reason instanceof Error ? reason.message : 'Упражнение недоступно')) }, [slug])
  return <PageLayout><div className="mx-auto max-w-5xl px-4 py-10"><Button variant="secondary" onClick={() => router.push('/exercises')}>← К упражнениям</Button>{!exercise && !error && <div className="py-16 text-center"><LoadingSpinner size="lg" /></div>}{error && <Typography variant="body" color="danger" className="mt-6">{error}</Typography>}{exercise && <><Typography variant="h1" weight="extrabold" className="mt-6">{exercise.title}</Typography><Typography variant="body" color="secondary" className="my-3">{exercise.instruction}</Typography><ExerciseRenderer key={exercise.slug} exercise={exercise} /></>}</div></PageLayout>
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button, LoadingSpinner, PageLayout, Typography } from '@/components'
import {
  ApiService,
  ExerciseSessionAction,
  ExerciseSessionRequestError,
  ExerciseSessionSnapshot,
} from '@/lib/api'
import { ExerciseRenderer } from '@/components/exercises/ExerciseRenderer'

export default function ExercisePage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedSessionId = searchParams.get('session_id')
  const [exercise, setExercise] = useState<ExerciseSessionSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [restarting, setRestarting] = useState(false)
  const started = useRef<string | null>(null)
  const replacement = useRef<Promise<ExerciseSessionSnapshot> | null>(null)

  const setAddress = useCallback((sessionId: string) => {
    router.replace(`/exercises/${slug}?session_id=${encodeURIComponent(sessionId)}`)
  }, [router, slug])

  const load = useCallback(async () => {
    const requestKey = `${slug}:${requestedSessionId ?? 'new'}`
    if (started.current === requestKey) return
    started.current = requestKey
    setLoading(true); setError(null); setExercise(null)
    try {
      let snapshot: ExerciseSessionSnapshot
      if (requestedSessionId) {
        try {
          snapshot = await ApiService.getExerciseSession(slug, requestedSessionId)
        } catch (reason) {
          if (!(reason instanceof ExerciseSessionRequestError) || reason.status !== 404) throw reason
          snapshot = await ApiService.createExerciseSession(slug)
        }
      } else {
        snapshot = await ApiService.createExerciseSession(slug)
      }
      setExercise(snapshot)
      if (snapshot.session_id !== requestedSessionId) {
        started.current = `${slug}:${snapshot.session_id}`
        setAddress(snapshot.session_id)
      }
    } catch (reason) {
      started.current = null
      setError(reason instanceof Error ? reason.message : 'Упражнение недоступно')
    } finally {
      setLoading(false)
    }
  }, [requestedSessionId, setAddress, slug])

  useEffect(() => { void load() }, [load])

  const replaceUnavailableSession = useCallback(async () => {
    const request = replacement.current ?? ApiService.createExerciseSession(slug)
    replacement.current = request
    try {
      const snapshot = await request
      started.current = `${slug}:${snapshot.session_id}`
      setExercise(snapshot)
      setAddress(snapshot.session_id)
    } finally {
      if (replacement.current === request) replacement.current = null
    }
  }, [setAddress, slug])

  const applyAction = useCallback(async (action: ExerciseSessionAction) => {
    if (!exercise) return
    try {
      const snapshot = await ApiService.applyExerciseSessionAction(slug, exercise.session_id, action)
      setExercise(current => !current || snapshot.revision < current.revision ? current : snapshot)
    } catch (reason) {
      if (!(reason instanceof ExerciseSessionRequestError) || reason.status !== 404) throw reason
      await replaceUnavailableSession()
    }
  }, [exercise, replaceUnavailableSession, slug])

  const restart = useCallback(async () => {
    if (!exercise) return
    setRestarting(true); setError(null)
    try {
      const snapshot = await ApiService.restartExerciseSession(slug, exercise.session_id)
      started.current = `${slug}:${snapshot.session_id}`
      setExercise(snapshot)
      setAddress(snapshot.session_id)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось начать заново')
    } finally {
      setRestarting(false)
    }
  }, [exercise, setAddress, slug])

  const fillBlanksLayout = exercise?.type_code === 'fill_blanks'

  return <PageLayout><main className={fillBlanksLayout ? 'mx-auto max-w-[880px] px-4 py-8 pb-10 sm:px-6 sm:py-12 sm:pb-16' : 'mx-auto max-w-5xl px-4 py-10'}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button variant="secondary" onClick={() => router.push('/exercises')}>← К упражнениям</Button>
      {exercise && <Button variant="ghost" onClick={() => void restart()} disabled={restarting}>{restarting ? 'Начинаем заново…' : 'Начать заново'}</Button>}
    </div>
    {loading && <div className="py-16" aria-label="Загрузка упражнения"><div className="space-y-5 animate-pulse"><div className="h-10 w-3/4 rounded bg-gray-200" /><div className="h-6 w-2/3 rounded bg-gray-200" /><div className="h-11 w-full rounded bg-gray-100" /><div className="h-11 w-5/6 rounded bg-gray-100" /></div></div>}
    {error && <div className="mt-6 space-y-3"><Typography variant="body" color="danger">{error}</Typography><Button variant="secondary" onClick={() => { started.current = null; void load() }}>Повторить</Button></div>}
    {exercise && <><Typography variant="h1" weight="extrabold" className={fillBlanksLayout ? 'mt-8 text-[40px] leading-[1.12] max-sm:text-[32px] max-sm:leading-[1.18]' : 'mt-6'}>{exercise.title}</Typography><Typography variant="body" color="secondary" className={fillBlanksLayout ? 'mt-3 text-[18px] leading-[1.55] max-sm:text-[16px] max-sm:leading-[1.5]' : 'my-3'}>{exercise.instruction}</Typography><section className={fillBlanksLayout ? 'mt-8' : undefined}><ExerciseRenderer key={exercise.session_id} exercise={exercise} onAction={applyAction} /></section></>}
  </main></PageLayout>
}

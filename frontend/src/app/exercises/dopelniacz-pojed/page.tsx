'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { PageLayout, Typography, LoadingSpinner, Button } from '@/components'
import { AuthService, API_ENDPOINTS } from '@/lib/api'

interface Exercise {
  id: string
  title: string
  description: string
  api: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  duration: string
}

interface Word {
  id: string
  word: string
  dopelniacz: string
}

interface WordState extends Word {
  isRevealed: boolean
  status: 'none' | 'correct' | 'incorrect'
}

export default function DopelniaczExercisePage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const exerciseId = 'dopelniacz-pojed' // Hardcoded for this specific exercise
  const exerciseUrl = 'dopelniacz/pojed' // Hardcoded for this specific exercise --- IGNORE ---

  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [words, setWords] = useState<WordState[]>([])
  const [exerciseLoading, setExerciseLoading] = useState(true)
  const [wordsLoading, setWordsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchExercise()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (exercise) {
      fetchWords()
    }
  }, [exercise])

  const fetchExercise = async () => {
    try {
      setExerciseLoading(true)

      const response = await fetch(`${API_ENDPOINTS.exercises}${exerciseUrl}`, {
        method: 'GET',
        headers: AuthService.getAuthHeaders()
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid, redirect to login
          AuthService.clearTokens()
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch exercise')
      }
      const data = await response.json()
      setExercise(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setExerciseLoading(false)
    }
  }

  const fetchWords = async () => {
    try {
      setWordsLoading(true)

      const response = await fetch(`${API_ENDPOINTS.exercises}${exerciseUrl}`, {
        method: 'GET',
        headers: AuthService.getAuthHeaders()
      })

      if (!response.ok) {
        if (response.status === 401) {
          AuthService.clearTokens()
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch words')
      }

      const data = await response.json()
      // Assuming the API returns an array of words with word and dopelniacz properties
      const wordsWithState: WordState[] = data.map((word: Word, index: number) => ({
        ...word,
        id: word.id || index.toString(),
        isRevealed: false,
        status: 'none' as const
      }))
      setWords(wordsWithState)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred fetching words')
    } finally {
      setWordsLoading(false)
    }
  }

  const handleShowAnswer = (wordId: string) => {
    setWords(prev => prev.map(word =>
      word.id === wordId ? { ...word, isRevealed: true } : word
    ))
  }

  const handleMarkResult = (wordId: string, isCorrect: boolean) => {
    setWords(prev => prev.map(word =>
      word.id === wordId ? { ...word, status: isCorrect ? 'correct' : 'incorrect' } : word
    ))
  }

  if (isLoading || exerciseLoading || wordsLoading) {
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
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Typography variant="h2" color="danger" className="mb-4">
              Exercise Not Found
            </Typography>
            <Typography variant="body" color="secondary" className="mb-6">
              {error}
            </Typography>
            <Button variant="primary" onClick={() => router.push('/exercises')}>
              Back to Exercises
            </Button>
          </div>
        </div>
      </PageLayout>
    )
  }

  if (!exercise) {
    return (
      <PageLayout>
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Typography variant="h2" className="mb-4">
              Exercise Not Found
            </Typography>
            <Typography variant="body" color="secondary" className="mb-6">
              The exercise you're looking for doesn't exist.
            </Typography>
            <Button variant="primary" onClick={() => router.push('/exercises')}>
              Back to Exercises
            </Button>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header section - fixed at top */}
        <div className="mb-8">
          <Button
            variant="secondary"
            onClick={() => router.push('/exercises')}
            className="mb-6"
          >
            ← Back to Exercises
          </Button>

          <div className="text-center mb-8">
            <Typography variant="h1" weight="extrabold" className="mb-4">
              {exercise.title}
            </Typography>
            <Typography variant="body" color="secondary" className="max-w-2xl mx-auto mb-6">
              {exercise.description}
            </Typography>

            <div className="flex justify-center items-center space-x-6 text-sm text-gray-500">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {exercise.difficulty}
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {exercise.duration}
              </span>
            </div>
          </div>
        </div>

        {/* Sticky progress section */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4 mb-6">
          <div className="text-center mb-4">
            <Typography variant="h3" className="mb-2">
              Practice Dopełniacz (Genitive Case)
            </Typography>
            <Typography variant="body" color="secondary">
              Try to guess the genitive form, then reveal the answer and mark whether you got it right.
            </Typography>
          </div>

          {/* Progress summary */}
          {words.length > 0 && (
            <div className="p-4 bg-gray-100 rounded-lg">
              <div className="flex justify-center space-x-8 text-sm">
                <span className="flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  Correct: {words.filter(w => w.status === 'correct').length}
                </span>
                <span className="flex items-center">
                  <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                  Incorrect: {words.filter(w => w.status === 'incorrect').length}
                </span>
                <span className="flex items-center">
                  <span className="w-3 h-3 bg-gray-400 rounded-full mr-2"></span>
                  Remaining: {words.filter(w => w.status === 'none').length}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable words section */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {words.length === 0 ? (
            <div className="text-center">
              <Typography variant="h3" className="mb-4">
                No Words Available
              </Typography>
              <Typography variant="body" color="secondary">
                No words found for this exercise. Please try again later.
              </Typography>
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto pr-2">
              {words.map((word) => (
                <div
                  key={word.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-colors ${
                    word.status === 'correct'
                      ? 'border-green-200 bg-green-50'
                      : word.status === 'incorrect'
                      ? 'border-red-200 bg-red-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {/* Original word */}
                  <div className="flex-shrink-0 w-32">
                    <Typography variant="body" weight="semibold" className="text-gray-900">
                      {word.word}
                    </Typography>
                  </div>

                  {/* Masked/Revealed dopelniacz */}
                  <div className="flex-grow">
                    <Typography variant="body" className="text-gray-700 font-mono">
                      {word.isRevealed ? word.dopelniacz : '***'}
                    </Typography>
                  </div>

                  {/* Action buttons */}
                  <div className="flex-shrink-0 flex gap-2">
                    {!word.isRevealed ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleShowAnswer(word.id)}
                      >
                        Show
                      </Button>
                    ) : word.status === 'none' ? (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleMarkResult(word.id, false)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          ✗ Fail
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleMarkResult(word.id, true)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          ✓ OK
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center">
                        {word.status === 'correct' ? (
                          <span className="text-green-600 font-semibold">✓ Correct</span>
                        ) : (
                          <span className="text-red-600 font-semibold">✗ Incorrect</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}

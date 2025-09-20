'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { PageLayout, Typography, LoadingSpinner, Button, Input } from '@/components'
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
  description: string
  word: string
}

interface WordState extends Word {
  userInput: string
  attempts: number
  status: 'none' | 'correct' | 'incorrect'
  showAnswer: boolean
  lastFailedInput: string
}

export default function NumeratorsExercisePage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const exerciseId = 'numerators' // Hardcoded for this specific exercise

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

      const response = await fetch(`${API_ENDPOINTS.exercises}${exerciseId}`, {
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

      const response = await fetch(`${API_ENDPOINTS.exercises}${exerciseId}`, {
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
      // Assuming the API returns an array of words with description and word properties
      const wordsWithState: WordState[] = data.map((word: Word, index: number) => ({
        ...word,
        id: word.id || index.toString(),
        userInput: '',
        attempts: 0,
        status: 'none' as const,
        showAnswer: false,
        lastFailedInput: ''
      }))
      setWords(wordsWithState)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred fetching words')
    } finally {
      setWordsLoading(false)
    }
  }

  const handleInputChange = (wordId: string, value: string) => {
    setWords(prev => prev.map(word =>
      word.id === wordId ? { ...word, userInput: value } : word
    ))
  }

  const handleCheckAnswer = (wordId: string) => {
    setWords(prev => prev.map(word => {
      if (word.id !== wordId) return word

      const newAttempts = word.attempts + 1
      const isCorrect = word.userInput.trim().toLowerCase() === word.word.toLowerCase()

      if (isCorrect) {
        return { ...word, attempts: newAttempts, status: 'correct' as const }
      } else if (newAttempts >= 3) {
        return {
          ...word,
          attempts: newAttempts,
          status: 'incorrect' as const,
          showAnswer: true,
          lastFailedInput: word.userInput.trim()
        }
      } else {
        return { ...word, attempts: newAttempts, userInput: '' }
      }
    }))
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
              Practice Liczebniki (Numerals)
            </Typography>
            <Typography variant="body" color="secondary">
              Read the description and type the correct Polish numeral. You have 3 attempts per word.
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
                  {/* Description */}
                  <div className="flex-shrink-0 w-48">
                    <Typography variant="body" weight="semibold" className="text-gray-900">
                      {word.description}
                    </Typography>
                  </div>

                  {/* Input field or answer */}
                  <div className="flex-grow">
                    {word.status === 'correct' ? (
                      <Typography variant="body" className="text-gray-700 font-mono">
                        {word.word}
                      </Typography>
                    ) : word.showAnswer && word.status === 'incorrect' ? (
                      <div className="font-mono">
                        {/* Failed input - crossed out in red */}
                        <div className="text-red-600 line-through mb-1">
                          {word.lastFailedInput}
                        </div>
                        {/* Correct answer - aligned to the beginning */}
                        <div className="text-green-600 font-semibold">
                          {word.word}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          value={word.userInput}
                          onChange={(e) => handleInputChange(word.id, e.target.value)}
                          placeholder="Enter Polish numeral..."
                          className="flex-grow"
                          disabled={word.status !== 'none'}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && word.userInput.trim()) {
                              handleCheckAnswer(word.id)
                            }
                          }}
                        />
                        {word.attempts > 0 && word.status === 'none' && (
                          <Typography variant="small" color="secondary">
                            {word.attempts}/3 attempts
                          </Typography>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex-shrink-0 flex gap-2">
                    {word.status === 'none' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleCheckAnswer(word.id)}
                        disabled={!word.userInput.trim()}
                      >
                        Check
                      </Button>
                    ) : (
                      <div className="flex items-center">
                        {word.status === 'correct' ? (
                          <span className="text-green-600 font-semibold">✓ Correct</span>
                        ) : (
                          <span className="text-red-600 font-semibold">✗ Failed</span>
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

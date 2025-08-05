'use client'

import { useAuth } from '@/contexts/AuthContext'
import { AuthService, API_ENDPOINTS } from '@/lib/api'
import { LessonLayout, Typography, Button, Icon, LoadingSpinner, InteractiveLessonTable } from '@/components'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function SingularNounsLesson() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  // Type definitions
  interface Noun {
    id: number
    word: string
    mianownik: string
    dopełniacz: string
    celownik: string
    biernik: string
    narzędnik: string
    miejscownik: string
    wołacz: string
  }

  interface CellState {
    isEditing?: boolean
    isCorrect?: boolean
    showAnswer?: boolean
    answer?: string
  }

  const [nouns, setNouns] = useState<Noun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cellStates, setCellStates] = useState<Record<string, CellState>>({})
  const [inputValues, setInputValues] = useState<Record<string, string>>({})
  const [attempts, setAttempts] = useState<Record<string, number>>({})

  // Cases configuration
  const cases = [
    { key: 'dopełniacz', name: 'Dopełniacz' },
    { key: 'celownik', name: 'Celownik' },
    { key: 'biernik', name: 'Biernik' },
    { key: 'narzędnik', name: 'Narzędnik' },
    { key: 'miejscownik', name: 'Miejscownik' },
    { key: 'wołacz', name: 'Wołacz' }
  ]  // Fetch nouns from API

  useEffect(() => {
    const fetchNouns = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.nounsSingle, {
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
          throw new Error('Failed to fetch nouns')
        }

        const data = await response.json()
        setNouns(data)
      } catch (err) {
        console.error('Error fetching nouns:', err)
        setError('Failed to load nouns. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    // Only fetch if user is authenticated
    if (isAuthenticated && !isLoading) {
      fetchNouns()
    } else if (!isLoading && !isAuthenticated) {
      setLoading(false)
    }
  }, [isAuthenticated, isLoading, router])

  // Handle cell click
  const handleCellClick = (nounId: number, caseKey: string) => {
    const cellKey = `${nounId}-${caseKey}`

    // Don't allow clicking on cells that already have answers
    if (cellStates[cellKey]?.showAnswer) {
      return
    }

    // Cancel all other editing cells first
    setCellStates(prev => {
      const newStates = { ...prev }
      Object.keys(newStates).forEach(key => {
        if (key !== cellKey && newStates[key]?.isEditing) {
          newStates[key] = { ...newStates[key], isEditing: false }
        }
      })
      return newStates
    })

    // Clear input values for other cells
    setInputValues(prev => {
      const newValues = { ...prev }
      Object.keys(newValues).forEach(key => {
        if (key !== cellKey) {
          delete newValues[key]
        }
      })
      return newValues
    })

    // Set the clicked cell to editing mode
    setCellStates(prev => ({
      ...prev,
      [cellKey]: { ...prev[cellKey], isEditing: true }
    }))
  }

  // Handle input change
  const handleInputChange = (nounId: number, caseKey: string, value: string) => {
    const cellKey = `${nounId}-${caseKey}`
    setInputValues(prev => ({
      ...prev,
      [cellKey]: value
    }))
  }

  // Handle OK button click
  const handleOk = (item: any, caseKey: string) => {
    const cellKey = `${item.id}-${caseKey}`
    const inputValue = inputValues[cellKey]?.trim().toLowerCase()
    const correctValue = item[caseKey as keyof typeof item]?.toString().toLowerCase()

    if (inputValue === correctValue) {
      // Correct answer
      setCellStates(prev => ({
        ...prev,
        [cellKey]: {
          isEditing: false,
          isCorrect: true,
          showAnswer: true,
          answer: item[caseKey as keyof typeof item]?.toString()
        }
      }))
      setInputValues(prev => ({ ...prev, [cellKey]: '' }))
      setAttempts(prev => ({ ...prev, [cellKey]: 0 }))
    } else {
      // Wrong answer
      const currentAttempts = attempts[cellKey] || 0
      const newAttempts = currentAttempts + 1

      if (newAttempts >= 3) {
        // Show correct answer after 3 attempts
        setCellStates(prev => ({
          ...prev,
          [cellKey]: {
            isEditing: false,
            isCorrect: false,
            showAnswer: true,
            answer: item[caseKey as keyof typeof item]?.toString()
          }
        }))
        setInputValues(prev => ({ ...prev, [cellKey]: '' }))
        setAttempts(prev => ({ ...prev, [cellKey]: 0 }))
      } else {
        // Allow another attempt
        setAttempts(prev => ({ ...prev, [cellKey]: newAttempts }))
        setInputValues(prev => ({ ...prev, [cellKey]: '' }))
      }
    }
  }

  // Handle Cancel button click
  const handleCancel = (nounId: number, caseKey: string) => {
    // Cancel all editing cells (like clicking on another cell)
    setCellStates(prev => {
      const newStates = { ...prev }
      Object.keys(newStates).forEach(key => {
        if (newStates[key]?.isEditing) {
          newStates[key] = { ...newStates[key], isEditing: false }
        }
      })
      return newStates
    })

    // Clear all input values
    setInputValues({})
  }

  if (isLoading || loading) {
    return <LoadingSpinner size="lg" />
  } else if (!isAuthenticated) {
    // Redirect to login if not authenticated
    router.push('/login')
    return null
  }

  if (error) {
    return (
      <LessonLayout>
        <div className="text-center">
          <Typography variant="h2" className="text-red-600">{error}</Typography>
        </div>
      </LessonLayout>
    )
  }

  return (
    <LessonLayout>
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <Link href="/lessons" className="hover:text-indigo-600">
                Lessons
              </Link>
            </li>
            <li>
              <Icon name="arrow-right" size="sm" />
            </li>
            <li className="text-gray-900">Singular Nouns</li>
          </ol>
        </nav>

        {/* Lesson Header */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
            <Icon name="document" size="md" className="text-blue-600" />
          </div>
          <Typography variant="h1" className="text-3xl font-extrabold text-gray-900">
            Singular Nouns Exercise
          </Typography>
        </div>

        <InteractiveLessonTable
          data={nouns}
          cases={cases}
          cellStates={cellStates}
          inputValues={inputValues}
          attempts={attempts}
          onCellClick={handleCellClick}
          onInputChange={handleInputChange}
          onOk={handleOk}
          onCancel={handleCancel}
          title="Interactive Exercise"
          description="Click on any case cell to fill in the correct form. You have 3 attempts per cell."
        />

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <Link href="/lessons">
            <Button variant="secondary" size="md">
              ← Back to Lessons
            </Button>
          </Link>
          <Link href="/lessons/plural-nouns">
            <Button variant="primary" size="md">
              Next: Plural Nouns →
            </Button>
          </Link>
        </div>
      </main>
    </LessonLayout>
  )
}

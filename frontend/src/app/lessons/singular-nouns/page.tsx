'use client'

import { useAuth } from '@/contexts/AuthContext'
import { AuthService, API_ENDPOINTS } from '@/lib/api'
import Navigation from '@/components/Navigation'
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
  const handleOk = (noun: Noun, caseKey: string) => {
    const cellKey = `${noun.id}-${caseKey}`
    const inputValue = inputValues[cellKey]?.trim().toLowerCase()
    const correctValue = noun[caseKey as keyof Noun]?.toString().toLowerCase()

    if (inputValue === correctValue) {
      // Correct answer
      setCellStates(prev => ({
        ...prev,
        [cellKey]: {
          isEditing: false,
          isCorrect: true,
          showAnswer: true,
          answer: noun[caseKey as keyof Noun]?.toString()
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
            answer: noun[caseKey as keyof Noun]?.toString()
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

  // Get cell content
  const getCellContent = (noun: Noun, caseKey: string) => {
    const cellKey = `${noun.id}-${caseKey}`
    const cellState = cellStates[cellKey]
    const inputValue = inputValues[cellKey] || ''
    const attemptCount = attempts[cellKey] || 0

    if (cellState?.isEditing) {
      return (
        <div className="flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(noun.id, caseKey, e.target.value)}
            className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mr-1"
            placeholder="Enter word..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleOk(noun, caseKey)
              } else if (e.key === 'Escape') {
                handleCancel(noun.id, caseKey)
              }
            }}
            autoFocus
          />
          <div className="flex ml-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleOk(noun, caseKey)
              }}
              className="p-0.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
              title="OK"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleCancel(noun.id, caseKey)
              }}
              className="p-0.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded ml-0.5"
              title="Cancel"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {attemptCount > 0 && (
            <div className="text-xs text-red-500 ml-2">
              {attemptCount}/3
            </div>
          )}
        </div>
      )
    }

    if (cellState?.showAnswer) {
      return (
        <span className="font-medium">
          {cellState.answer}
        </span>
      )
    }

    return (
      <div className="text-center">
        <span className="text-gray-400">Click to fill</span>
      </div>
    )
  }

  // Get cell class
  const getCellClass = (noun: Noun, caseKey: string) => {
    const cellKey = `${noun.id}-${caseKey}`
    const cellState = cellStates[cellKey]

    if (cellState?.showAnswer) {
      if (cellState.isCorrect) {
        return "p-3 border-2 border-green-500 bg-green-50 transition-colors"
      } else {
        return "p-3 border-2 border-red-500 bg-red-50 transition-colors"
      }
    }

    return "p-3 border cursor-pointer hover:bg-gray-50 transition-colors"
  }

  // Redirect to login if not authenticated
  if (!isLoading && !isAuthenticated) {
    router.push('/login')
    return null
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse bg-gray-200 h-8 w-64 mx-auto rounded-md"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-red-600 text-lg">{error}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </li>
            <li className="text-gray-900">Singular Nouns</li>
          </ol>
        </nav>

        {/* Lesson Header */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            Singular Nouns Exercise
          </h1>
        </div>

        {/* Interactive Exercise Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Interactive Exercise</h3>
            <p className="text-sm text-gray-600 mt-1">
              Click on any case cell to fill in the correct form. You have 3 attempts per cell.
            </p>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              {/* Fixed Header */}
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-20 border-r min-w-[120px]">
                    Word
                  </th>
                  {cases.map((case_) => (
                    <th key={case_.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                      {case_.name}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="bg-white divide-y divide-gray-200">
                {nouns.map((noun, index) => (
                  <tr key={noun.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {/* Fixed Word Column */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-inherit z-10 border-r">
                      {noun.word}
                    </td>

                    {/* Case Columns */}
                    {cases.map((case_) => (
                      <td
                        key={`${noun.id}-${case_.key}`}
                        className={getCellClass(noun, case_.key)}
                        onClick={() => handleCellClick(noun.id, case_.key)}
                      >
                        {getCellContent(noun, case_.key)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <Link
            href="/lessons"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md font-medium"
          >
            ← Back to Lessons
          </Link>
          <Link
            href="/lessons/plural-nouns"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md font-medium"
          >
            Next: Plural Nouns →
          </Link>
        </div>
      </main>
    </div>
  )
}

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

  const [nouns, setNouns] = useState<Noun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  return (
    <LessonLayout loading={isLoading || loading} error={error}>
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
        title="Singular Nouns Declension"
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
    </LessonLayout>
  )
}

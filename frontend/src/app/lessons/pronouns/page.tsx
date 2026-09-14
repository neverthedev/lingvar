'use client'

import { useAuth } from '@/contexts/AuthContext'
import { AuthService, API_ENDPOINTS } from '@/lib/api'
import { LessonLayout, Typography, Icon, InteractiveLessonTable, LessonNavigation } from '@/components'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function PronounsLesson() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  // Type definitions for pronouns
  interface Pronoun {
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

  const [pronouns, setPronouns] = useState<Pronoun[]>([])
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
  ]

  // Breadcrumb configuration
  const breadcrumbs = [
    { href: '/lessons', label: 'Lessons' },
    { label: 'Pronouns', current: true }
  ]

  // Fetch pronouns from API
  useEffect(() => {
    const fetchPronouns = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.pronouns, {
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
          throw new Error('Failed to fetch pronouns')
        }

        const data = await response.json()
        setPronouns(data)
      } catch (err) {
        console.error('Error fetching pronouns:', err)
        setError('Failed to load pronouns. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    // Only fetch if user is authenticated
    if (isAuthenticated && !isLoading) {
      fetchPronouns()
    } else if (!isLoading && !isAuthenticated) {
      setLoading(false)
    }
  }, [isAuthenticated, isLoading, router])

  return (
    <LessonLayout loading={isLoading || loading} error={error} breadcrumbs={breadcrumbs}>
      {/* Lesson Header */}
      <div className="flex items-center justify-center mb-6">
        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
          <Icon name="user" size="md" className="text-purple-600" />
        </div>
        <Typography variant="h1" className="text-3xl font-extrabold text-gray-900">
          Pronouns Exercise
        </Typography>
      </div>

      <InteractiveLessonTable
        data={pronouns}
        cases={cases}
        title="Pronouns Declension"
        description="Click on any case cell to fill in the correct form. You have 3 attempts per cell."
        wordType="pronoun"
      />

      <LessonNavigation
        previousLesson={{ href: '/lessons/singular-nouns', title: 'Singular Nouns' }}
        nextLesson={{ href: '/lessons/verbs', title: 'Verbs' }}
        backToLessons={{ href: '/lessons', title: 'Back to Lessons' }}
      />
    </LessonLayout>
  )
}

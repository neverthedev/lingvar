'use client'

import { useAuth } from '@/contexts/AuthContext'
import { AuthService, API_ENDPOINTS } from '@/lib/api'
import { LessonLayout, Typography, Icon, InteractiveLessonTable, LessonNavigation } from '@/components'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function VerbsLesson() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  // Type definitions
  interface Verb {
    id: number
    word: string
    ja: string
    ty: string
    ono: string
    my: string
    wy: string
    one: string
  }

  const [verbs, setVerbs] = useState<Verb[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Personal pronouns configuration
  const cases = [
    { key: 'ja', name: 'Ja' },
    { key: 'ono', name: 'On/Ona/Ono' },
    { key: 'ty', name: 'Ty' },
    { key: 'my', name: 'My' },
    { key: 'wy', name: 'Wy' },
    { key: 'one', name: 'Oni/One' }
  ]

  // Fetch verbs from API
  useEffect(() => {
    const fetchVerbs = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.verbs, {
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
          throw new Error('Failed to fetch verbs')
        }

        const data = await response.json()
        setVerbs(data)
      } catch (err) {
        console.error('Error fetching verbs:', err)
        setError('Failed to load verbs. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    // Only fetch if user is authenticated
    if (isAuthenticated && !isLoading) {
      fetchVerbs()
    } else if (!isLoading && !isAuthenticated) {
      setLoading(false)
    }
  }, [isAuthenticated, isLoading, router])

  // Breadcrumb configuration
  const breadcrumbs = [
    { href: '/lessons', label: 'Lessons' },
    { label: 'Verbs', current: true }
  ]

  return (
    <LessonLayout loading={isLoading || loading} error={error} breadcrumbs={breadcrumbs}>
      {/* Lesson Header */}
      <div className="flex items-center justify-center mb-6">
        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
          <Icon name="book" size="md" className="text-green-600" />
        </div>
        <Typography variant="h1" className="text-3xl font-extrabold text-gray-900">
          Verbs Exercise
        </Typography>
      </div>

      <InteractiveLessonTable
        data={verbs}
        cases={cases}
        title="Verb Conjugation"
        description="Click on any conjugation cell to fill in the correct form. You have 3 attempts per cell."
        wordType="verb"
      />

      <LessonNavigation
        previousLesson={{ href: '/lessons/pronouns', title: 'Pronouns' }}
        nextLesson={{ href: '/lessons/plural-nouns', title: 'Plural Nouns' }}
        backToLessons={{ href: '/lessons', title: 'Back to Lessons' }}
      />
    </LessonLayout>
  )
}

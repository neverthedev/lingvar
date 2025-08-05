'use client'

import { useAuth } from '@/contexts/AuthContext'
import { LessonLayout, Typography, Button, Icon, LoadingSpinner, LessonSection } from '@/components'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function PluralNounsLesson() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  if (isLoading) {
    return <LoadingSpinner size="lg" />
  } else if (!isAuthenticated) {
    // Redirect to login if not authenticated
    router.push('/login')
    return null
  }

  return (
    <LessonLayout>
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
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
            <li className="text-gray-900">Plural Nouns</li>
          </ol>
        </nav>

        {/* Lesson Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Icon name="book" size="lg" className="text-green-600" />
          </div>
          <Typography variant="h1" className="text-4xl font-extrabold text-gray-900 mb-4">
            Plural Nouns Exercise
          </Typography>
          <Typography variant="body" className="text-lg text-gray-600 max-w-2xl mx-auto">
            Master the rules of plural noun formation and practice with various examples and exceptions.
          </Typography>
        </div>

        {/* Lesson Content */}
        <div className="space-y-6">

        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <Link href="/lessons/singular-nouns">
            <Button variant="secondary" size="md">
              ← Previous: Singular Nouns
            </Button>
          </Link>
          <Link href="/lessons">
            <Button variant="primary" size="md">
              Back to Lessons
            </Button>
          </Link>
        </div>
      </main>
    </LessonLayout>
  )
}

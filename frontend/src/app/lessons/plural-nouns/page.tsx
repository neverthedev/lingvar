'use client'

import { useAuth } from '@/contexts/AuthContext'
import { LessonLayout, Typography, Icon, LessonSection, LessonNavigation } from '@/components'

export default function PluralNounsLesson() {
  const { isLoading } = useAuth()

  // Breadcrumb configuration
  const breadcrumbs = [
    { href: '/lessons', label: 'Lessons' },
    { label: 'Plural Nouns', current: true }
  ]

  return (
    <LessonLayout loading={isLoading} breadcrumbs={breadcrumbs}>
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

      <LessonNavigation
        previousLesson={{ href: '/lessons/pronouns', title: 'Pronouns' }}
        backToLessons={{ href: '/lessons', title: 'Back to Lessons' }}
      />
    </LessonLayout>
  )
}

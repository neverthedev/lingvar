'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { PageLayout, LessonGrid, Typography, LoadingSpinner } from '@/components'

const lessonsData = [
  {
    id: 'singular-nouns',
    title: 'Singular Nouns',
    description: 'Practice identifying and using singular nouns in different contexts. Learn the basics of noun usage.',
    href: '/lessons/singular-nouns',
    difficulty: 'Beginner' as const,
    duration: '15 min'
  },
  {
    id: 'plural-nouns',
    title: 'Plural Nouns',
    description: 'Master the formation and usage of plural nouns. Understand different pluralization rules.',
    href: '/lessons/plural-nouns',
    difficulty: 'Intermediate' as const,
    duration: '20 min'
  }
]

export default function LessonsPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  if (isLoading) {
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

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Typography variant="h1" weight="extrabold" align="center" className="mb-4">
            Interactive Lessons
          </Typography>
          <Typography variant="body" color="secondary" align="center" className="max-w-2xl mx-auto">
            Choose from our collection of interactive lessons to practice and improve your language skills.
          </Typography>
        </div>

        <LessonGrid lessons={lessonsData} />
      </div>
    </PageLayout>
  )
}

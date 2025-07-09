'use client'

import { useAuth } from '@/contexts/AuthContext'
import Navigation from '@/components/Navigation'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SingularNounsLesson() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  // Redirect to login if not authenticated
  if (!isLoading && !isAuthenticated) {
    router.push('/login')
    return null
  }

  if (isLoading) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </li>
            <li className="text-gray-900">Singular Nouns</li>
          </ol>
        </nav>

        {/* Lesson Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            Singular Nouns Exercise
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Learn and practice identifying singular nouns in different contexts. This lesson will help you understand the basics of noun usage.
          </p>
        </div>

        {/* Lesson Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What are Singular Nouns?</h2>
            <p className="text-gray-600 mb-4">
              A singular noun refers to just one person, place, thing, or idea. Unlike plural nouns, singular nouns don't have an 's' at the end (in most cases).
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Examples of Singular Nouns:</h3>
              <ul className="text-blue-800 space-y-1">
                <li>• <strong>cat</strong> (one cat)</li>
                <li>• <strong>book</strong> (one book)</li>
                <li>• <strong>house</strong> (one house)</li>
                <li>• <strong>idea</strong> (one idea)</li>
                <li>• <strong>teacher</strong> (one teacher)</li>
              </ul>
            </div>
          </div>

          {/* Interactive Exercise Placeholder */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Interactive Exercise</h3>
            <p className="text-gray-600 mb-4">
              This is where the interactive exercise will be implemented. Students will be able to:
            </p>
            <ul className="text-gray-600 text-left max-w-md mx-auto space-y-2">
              <li>• Identify singular nouns in sentences</li>
              <li>• Practice with drag-and-drop exercises</li>
              <li>• Get immediate feedback on their answers</li>
              <li>• Track their progress through the lesson</li>
            </ul>
            <div className="mt-6">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium">
                Start Exercise (Coming Soon)
              </button>
            </div>
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

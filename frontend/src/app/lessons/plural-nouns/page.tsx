'use client'

import { useAuth } from '@/contexts/AuthContext'
import Navigation from '@/components/Navigation'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function PluralNounsLesson() {
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
            <li className="text-gray-900">Plural Nouns</li>
          </ol>
        </nav>

        {/* Lesson Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            Plural Nouns Exercise
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Master the rules of plural noun formation and practice with various examples and exceptions.
          </p>
        </div>

        {/* Lesson Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What are Plural Nouns?</h2>
            <p className="text-gray-600 mb-4">
              Plural nouns refer to more than one person, place, thing, or idea. Most plural nouns are formed by adding 's' or 'es' to the end of the singular noun.
            </p>

            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
              <h3 className="font-semibold text-green-900 mb-2">Common Plural Formation Rules:</h3>
              <ul className="text-green-800 space-y-2">
                <li>• Add <strong>s</strong>: cat → cats, book → books</li>
                <li>• Add <strong>es</strong> (words ending in s, x, z, ch, sh): box → boxes, dish → dishes</li>
                <li>• Change <strong>y to ies</strong> (after consonant): city → cities, baby → babies</li>
                <li>• Change <strong>f/fe to ves</strong>: leaf → leaves, knife → knives</li>
                <li>• <strong>Irregular plurals</strong>: child → children, mouse → mice</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <h3 className="font-semibold text-yellow-900 mb-2">Examples:</h3>
              <div className="grid grid-cols-2 gap-4 text-yellow-800">
                <div>
                  <strong>Regular:</strong>
                  <ul className="mt-1 space-y-1">
                    <li>• dog → dogs</li>
                    <li>• house → houses</li>
                    <li>• story → stories</li>
                  </ul>
                </div>
                <div>
                  <strong>Irregular:</strong>
                  <ul className="mt-1 space-y-1">
                    <li>• man → men</li>
                    <li>• foot → feet</li>
                    <li>• tooth → teeth</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Exercise Placeholder */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Interactive Exercise</h3>
            <p className="text-gray-600 mb-4">
              This is where the interactive exercise will be implemented. Students will be able to:
            </p>
            <ul className="text-gray-600 text-left max-w-md mx-auto space-y-2">
              <li>• Convert singular nouns to plural forms</li>
              <li>• Practice with different plural formation rules</li>
              <li>• Learn irregular plural forms</li>
              <li>• Get immediate feedback and explanations</li>
            </ul>
            <div className="mt-6">
              <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium">
                Start Exercise (Coming Soon)
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <Link
            href="/lessons/singular-nouns"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md font-medium"
          >
            ← Previous: Singular Nouns
          </Link>
          <Link
            href="/lessons"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md font-medium"
          >
            Back to Lessons
          </Link>
        </div>
      </main>
    </div>
  )
}

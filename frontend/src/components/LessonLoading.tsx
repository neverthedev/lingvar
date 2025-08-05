import Navigation from './Navigation'

export default function LessonLoading() {
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

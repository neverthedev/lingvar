import React from 'react'
import Link from 'next/link'
import { Button } from '../atoms'

export interface LessonNavigationProps {
  previousLesson?: {
    href: string
    title: string
  }
  nextLesson?: {
    href: string
    title: string
  }
  backToLessons?: {
    href: string
    title?: string
  }
  className?: string
}

export const LessonNavigation: React.FC<LessonNavigationProps> = ({
  previousLesson,
  nextLesson,
  backToLessons = { href: '/lessons', title: 'Back to Lessons' },
  className = ''
}) => {
  return (
    <div className={`mt-8 flex justify-between ${className}`}>
      <div>
        {previousLesson ? (
          <Link href={previousLesson.href}>
            <Button variant="secondary" size="md">
              ← Previous: {previousLesson.title}
            </Button>
          </Link>
        ) : (
          backToLessons && (
            <Link href={backToLessons.href}>
              <Button variant="secondary" size="md">
                ← {backToLessons.title}
              </Button>
            </Link>
          )
        )}
      </div>

      <div>
        {nextLesson ? (
          <Link href={nextLesson.href}>
            <Button variant="primary" size="md">
              Next: {nextLesson.title} →
            </Button>
          </Link>
        ) : (
          backToLessons && !previousLesson && (
            <Link href={backToLessons.href}>
              <Button variant="primary" size="md">
                {backToLessons.title}
              </Button>
            </Link>
          )
        )}
      </div>
    </div>
  )
}

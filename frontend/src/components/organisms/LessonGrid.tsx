import React from 'react'
import { LessonCard } from '../molecules'

export interface LessonGridProps {
  lessons: Array<{
    id: string
    title: string
    description: string
    href: string
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced'
    duration?: string
  }>
  className?: string
}

export const LessonGrid: React.FC<LessonGridProps> = ({
  lessons,
  className = ''
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 ${className}`}>
      {lessons.map((lesson) => (
        <LessonCard
          key={lesson.id}
          title={lesson.title}
          description={lesson.description}
          href={lesson.href}
          difficulty={lesson.difficulty}
          duration={lesson.duration}
        />
      ))}
    </div>
  )
}

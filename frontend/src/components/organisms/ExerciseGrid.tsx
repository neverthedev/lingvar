import React from 'react'
import { ExerciseCard } from '../molecules'

export interface ExerciseGridProps {
  exercises: Array<{
    id: string
    title: string
    description: string
    api: string
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced'
    duration?: string
  }>
  className?: string
}

export const ExerciseGrid: React.FC<ExerciseGridProps> = ({
  exercises,
  className = ''
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 ${className}`}>
      {exercises.map((exercise) => (
        <ExerciseCard
          key={exercise.id}
          title={exercise.title}
          description={exercise.description}
          href={`/exercises/${exercise.id}`}
          api={exercise.api}
          difficulty={exercise.difficulty}
          duration={exercise.duration}
        />
      ))}
    </div>
  )
}

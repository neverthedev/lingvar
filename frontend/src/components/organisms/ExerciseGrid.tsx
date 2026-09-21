import React from 'react'
import { ExerciseCard } from '../molecules'
import { ExerciseCatalogItem } from '@/lib/api'

export interface ExerciseGridProps {
  exercises: ExerciseCatalogItem[]
  className?: string
}

export const ExerciseGrid: React.FC<ExerciseGridProps> = ({
  exercises,
  className = ''
}) => {
  return (
    <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 ${className}`}>
      {exercises.map((exercise) => (
        <ExerciseCard
          key={exercise.slug}
          slug={exercise.slug}
          title={exercise.title}
          description={exercise.description}
          difficulty={exercise.difficulty}
        />
      ))}
    </div>
  )
}

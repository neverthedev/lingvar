import React from 'react'
import Link from 'next/link'
import { Icon, Typography } from '../atoms'

export interface LessonCardProps {
  title: string
  description: string
  href: string
  icon?: 'document' | 'book'
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced'
  duration?: string
  className?: string
}

export const LessonCard: React.FC<LessonCardProps> = ({
  title,
  description,
  href,
  icon = 'document',
  difficulty = 'Beginner',
  duration,
  className = ''
}) => {
  return (
    <Link href={href}>
      <div className={`bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 border border-gray-200 hover:border-indigo-200 cursor-pointer ${className}`}>
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
            <Icon name={icon} size="lg" className="text-blue-600" />
          </div>
          <div className="flex-1">
            <Typography variant="h5" weight="semibold" className="mb-2">
              {title}
            </Typography>
          </div>
        </div>

        <Typography variant="body" color="secondary" className="mb-4">
          {description}
        </Typography>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <Icon name="user" size="sm" className="mr-1" />
              {difficulty}
            </span>
            {duration && (
              <span className="flex items-center">
                <Icon name="book" size="sm" className="mr-1" />
                {duration}
              </span>
            )}
          </div>
          <Icon name="arrow-right" size="sm" />
        </div>
      </div>
    </Link>
  )
}

import React from 'react'
import { Typography } from '../atoms'

interface LessonSectionProps {
  title: string
  children: React.ReactNode
  variant?: 'default' | 'info' | 'success' | 'warning' | 'danger'
  className?: string
}

const variantStyles = {
  default: 'bg-white border border-gray-200',
  info: 'bg-blue-50 border-l-4 border-blue-400',
  success: 'bg-green-50 border-l-4 border-green-400',
  warning: 'bg-yellow-50 border-l-4 border-yellow-400',
  danger: 'bg-red-50 border-l-4 border-red-400'
}

const textColors = {
  default: 'text-gray-900',
  info: 'text-blue-900',
  success: 'text-green-900',
  warning: 'text-yellow-900',
  danger: 'text-red-900'
}

export const LessonSection: React.FC<LessonSectionProps> = ({
  title,
  children,
  variant = 'default',
  className = ''
}) => {
  return (
    <div className={`rounded-lg p-6 mb-6 ${variantStyles[variant]} ${className}`}>
      <Typography variant="h3" className={`font-semibold mb-4 ${textColors[variant]}`}>
        {title}
      </Typography>
      <div className={variant !== 'default' ? textColors[variant] : 'text-gray-600'}>
        {children}
      </div>
    </div>
  )
}

import React from 'react'
import Link from 'next/link'
import { Icon, Typography } from '../atoms'

export interface ExerciseCardProps {
  slug: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  className?: string
}

const variants = [
  { icon: 'book' as const, background: 'bg-emerald-50', foreground: 'text-emerald-600' },
  { icon: 'document' as const, background: 'bg-rose-50', foreground: 'text-rose-600' },
  { icon: 'user' as const, background: 'bg-blue-50', foreground: 'text-blue-600' },
  { icon: 'book' as const, background: 'bg-indigo-50', foreground: 'text-indigo-600' },
]

const variantFor = (slug: string) => {
  const hash = Array.from(slug).reduce((value, character) => ((value * 31) + character.charCodeAt(0)) >>> 0, 0)
  return variants[hash % variants.length]
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  slug,
  title,
  description,
  difficulty,
  className = ''
}) => {
  const variant = variantFor(slug)

  return (
    <Link
      href={`/exercises/${slug}`}
      className={`grid min-h-[132px] grid-cols-[76px_minmax(0,1fr)] items-center gap-4 rounded-xl border border-gray-200 bg-white p-6 transition-colors hover:border-indigo-400 hover:bg-indigo-50/20 focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:grid-cols-[76px_minmax(0,1fr)_auto] ${className}`}
    >
      <span className={`flex h-[76px] w-[76px] items-center justify-center rounded-lg ${variant.background}`} aria-hidden="true">
        <Icon name={variant.icon} size="lg" className={variant.foreground} />
      </span>
      <span className="min-w-0 self-center">
        <Typography variant="h5" weight="semibold" className="text-gray-950">
          {title}
        </Typography>
        {description && (
          <Typography variant="body" color="secondary" className="mt-1 leading-6">
            {description}
          </Typography>
        )}
      </span>
      <span className="col-start-2 flex min-h-10 shrink-0 items-center gap-3 justify-self-end self-center pl-1 text-gray-500 sm:col-start-3">
        <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-700">
          {difficulty}
        </span>
        <Icon name="arrow-right" size="md" aria-hidden="true" />
      </span>
    </Link>
  )
}

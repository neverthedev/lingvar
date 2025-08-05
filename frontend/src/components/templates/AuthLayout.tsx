import React from 'react'
import Link from 'next/link'
import { Typography } from '../atoms'

export interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  alternativeAction?: {
    text: string
    linkText: string
    href: string
  }
  className?: string
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  alternativeAction,
  className = ''
}) => {
  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="max-w-md w-full space-y-8">
        <div>
          <Typography variant="h2" weight="extrabold" align="center" className="mt-6">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body" color="secondary" align="center" className="mt-2">
              {subtitle}
            </Typography>
          )}
          {alternativeAction && (
            <Typography variant="small" color="secondary" align="center" className="mt-2">
              {alternativeAction.text}{' '}
              <Link href={alternativeAction.href} className="font-medium text-indigo-600 hover:text-indigo-500">
                {alternativeAction.linkText}
              </Link>
            </Typography>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}

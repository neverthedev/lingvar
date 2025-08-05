import React from 'react'
import Link from 'next/link'
import { Typography } from '../atoms'

export interface FooterProps {
  className?: string
}

export const Footer: React.FC<FooterProps> = ({
  className = ''
}) => {
  return (
    <footer className={`bg-gray-50 border-t mt-16 ${className}`}>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Typography variant="h5" weight="bold" className="text-indigo-600 mb-4">
              LingVar
            </Typography>
            <Typography variant="body" color="secondary" className="mb-4">
              A modern language learning platform that helps you master new languages through interactive exercises.
            </Typography>
          </div>

          <div>
            <Typography variant="h6" weight="semibold" className="mb-4">
              Quick Links
            </Typography>
            <div className="space-y-2">
              <Link href="/lessons" className="block text-gray-600 hover:text-indigo-600">
                Lessons
              </Link>
              <Link href="/about" className="block text-gray-600 hover:text-indigo-600">
                About
              </Link>
              <Link href="/contact" className="block text-gray-600 hover:text-indigo-600">
                Contact
              </Link>
            </div>
          </div>

          <div>
            <Typography variant="h6" weight="semibold" className="mb-4">
              Support
            </Typography>
            <div className="space-y-2">
              <Link href="/help" className="block text-gray-600 hover:text-indigo-600">
                Help Center
              </Link>
              <Link href="/privacy" className="block text-gray-600 hover:text-indigo-600">
                Privacy Policy
              </Link>
              <Link href="/terms" className="block text-gray-600 hover:text-indigo-600">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <Typography variant="small" color="secondary" align="center">
            © 2025 LingVar. All rights reserved.
          </Typography>
        </div>
      </div>
    </footer>
  )
}

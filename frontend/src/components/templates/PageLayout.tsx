import React from 'react'
import { Navigation, Footer } from '../organisms'

export interface PageLayoutProps {
  children: React.ReactNode
  showFooter?: boolean
  className?: string
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  showFooter = true,
  className = ''
}) => {
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <Navigation />
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  )
}

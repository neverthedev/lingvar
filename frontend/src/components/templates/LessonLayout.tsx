import React from 'react'
import { Navigation } from '../organisms'
import { Breadcrumb, BreadcrumbItem } from '../molecules'

export interface LessonLayoutProps {
  children: React.ReactNode
  breadcrumbs?: BreadcrumbItem[]
  sidebar?: React.ReactNode
  className?: string
}

export const LessonLayout: React.FC<LessonLayoutProps> = ({
  children,
  breadcrumbs,
  sidebar,
  className = ''
}) => {
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <Navigation />
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {breadcrumbs && <Breadcrumb items={breadcrumbs} />}

        <div className="flex flex-col lg:flex-row gap-8">
          {sidebar && (
            <aside className="lg:w-64 flex-shrink-0">
              {sidebar}
            </aside>
          )}

          <section className="flex-1">
            {children}
          </section>
        </div>
      </main>
    </div>
  )
}

import React from 'react'
import Link from 'next/link'
import { Icon, Typography } from '../atoms'

export interface BreadcrumbItem {
  href?: string
  label: string
  current?: boolean
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  className = ''
}) => {
  return (
    <nav className={`mb-8 ${className}`}>
      <ol className="flex items-center space-x-2 text-sm text-gray-500">
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <li>
              {item.href && !item.current ? (
                <Link href={item.href} className="hover:text-indigo-600">
                  {item.label}
                </Link>
              ) : (
                <Typography
                  as="span"
                  variant="small"
                  color={item.current ? 'primary' : 'secondary'}
                >
                  {item.label}
                </Typography>
              )}
            </li>
            {index < items.length - 1 && (
              <li>
                <Icon name="arrow-right" size="sm" />
              </li>
            )}
          </React.Fragment>
        ))}
      </ol>
    </nav>
  )
}

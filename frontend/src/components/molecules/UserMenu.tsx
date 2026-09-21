'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Button, Icon } from '../atoms'

export interface UserMenuProps {
  user?: {
    username: string
    email: string
  }
  isAuthenticated: boolean
  onLogout: () => void
  className?: string
}

export const UserMenu: React.FC<UserMenuProps> = ({
  user,
  isAuthenticated,
  onLogout,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const closeOutside = (event: MouseEvent | FocusEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsOpen(false)
      triggerRef.current?.focus()
    }

    document.addEventListener('mousedown', closeOutside)
    document.addEventListener('focusin', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOutside)
      document.removeEventListener('focusin', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  if (!isAuthenticated) {
    return (
      <div className={`flex items-center space-x-4 ${className}`}>
        <Link
          href="/login"
          className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
        >
          Login
        </Link>
        <Link href="/signup">
          <Button
            variant="primary"
            size="sm"
          >
            Sign Up
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`relative flex items-center ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(current => !current)}
        className="inline-flex min-h-10 max-w-[15rem] items-center gap-2 rounded-lg px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
      >
        <Icon name="user" size="md" aria-hidden="true" className="shrink-0" />
        <span className="truncate">{user?.username}</span>
        <Icon name="triangle-down" size="sm" aria-hidden="true" className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 min-w-40 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
          <button
            type="button"
            role="menuitem"
            onClick={() => { setIsOpen(false); onLogout() }}
            className="flex min-h-10 w-full items-center rounded-md px-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Выйти
          </button>
        </div>
      )}
    </div>
  )
}

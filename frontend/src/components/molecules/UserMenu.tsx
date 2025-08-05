import React from 'react'
import Link from 'next/link'
import { Button, Typography } from '../atoms'

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
    <div className={`flex items-center space-x-4 ${className}`}>
      <Typography variant="small" color="secondary">
        Welcome, {user?.username}!
      </Typography>
      <Button
        onClick={onLogout}
        variant="primary"
        size="sm"
      >
        Logout
      </Button>
    </div>
  )
}

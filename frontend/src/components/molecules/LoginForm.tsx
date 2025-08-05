import React, { useState } from 'react'
import { Button, Input } from '../atoms'

export interface LoginFormProps {
  onSubmit: (data: { username: string; password: string }) => Promise<void>
  isLoading?: boolean
  error?: string
  message?: string
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isLoading = false,
  error,
  message
}) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
          {message}
        </div>
      )}

      <div className="rounded-md shadow-sm -space-y-px">
        <div>
          <Input
            id="username"
            name="username"
            type="text"
            required
            className="rounded-t-md"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
          />
        </div>
        <div>
          <Input
            id="password"
            name="password"
            type="password"
            required
            className="rounded-b-md"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-sm text-center">{error}</div>
      )}

      <div>
        <Button
          type="submit"
          isLoading={isLoading}
          className="w-full"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
      </div>
    </form>
  )
}

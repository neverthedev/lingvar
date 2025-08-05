import React, { useState } from 'react'
import { Button, Input } from '../atoms'

export interface SignupFormProps {
  onSubmit: (data: { username: string; email: string; password: string }) => Promise<void>
  isLoading?: boolean
  error?: string
}

export const SignupForm: React.FC<SignupFormProps> = ({
  onSubmit,
  isLoading = false,
  error
}) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [validationError, setValidationError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setValidationError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match')
      return
    }

    await onSubmit({
      username: formData.username,
      email: formData.email,
      password: formData.password
    })
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <Input
          label="Username"
          id="username"
          name="username"
          type="text"
          required
          placeholder="Choose a username"
          value={formData.username}
          onChange={handleChange}
        />

        <Input
          label="Email address"
          id="email"
          name="email"
          type="email"
          required
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleChange}
        />

        <Input
          label="Password"
          id="password"
          name="password"
          type="password"
          required
          placeholder="Create a password"
          value={formData.password}
          onChange={handleChange}
        />

        <Input
          label="Confirm Password"
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={validationError}
        />
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
          {isLoading ? 'Creating account...' : 'Create account'}
        </Button>
      </div>
    </form>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthLayout, SignupForm } from '@/components'

export default function SignupPage() {
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (data: { username: string; email: string; password: string }) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:8000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Registration failed')
      }

      // Redirect to login with success message
      router.push('/login?message=Account created successfully! Please sign in.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      alternativeAction={{
        text: "Already have an account?",
        linkText: "sign in to your existing account",
        href: "/login"
      }}
    >
      <SignupForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        error={error}
      />
    </AuthLayout>
  )
}

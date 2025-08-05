'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { AuthLayout, LoginForm } from '@/components'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()

  const message = searchParams.get('message')

  const handleSubmit = async (data: { username: string; password: string }) => {
    setIsLoading(true)
    setError('')

    try {
      await login(data.username, data.password)
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Sign in to your account"
      alternativeAction={{
        text: "Or",
        linkText: "create a new account",
        href: "/signup"
      }}
    >
      <LoginForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        error={error}
        message={message || undefined}
      />
    </AuthLayout>
  )
}

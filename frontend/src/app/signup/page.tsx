'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthLayout, SignupForm } from '@/components'
import { ApiService } from '@/lib/api'

export default function SignupPage() {
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (data: { username: string; email: string; password: string }) => {
    setIsLoading(true)
    setError('')

    try {
      await ApiService.register(data)
      router.push('/login?message=Account created successfully! Please sign in.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not create your account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      alternativeAction={{
        text: "Or",
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

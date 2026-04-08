'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()

        if (!cancelled) {
          if (data.user) {
            setIsAuthenticated(true)
          } else {
            router.replace('/login')
          }
        }
      } catch {
        if (!cancelled) {
          router.replace('/login')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    checkAuth()
    return () => { cancelled = true }
  }, [router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

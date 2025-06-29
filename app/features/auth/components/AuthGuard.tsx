'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '../store/useAuthStore'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    // ログインページは認証不要
    if (pathname === '/login') {
      return
    }

    // 未認証の場合はログインページへリダイレクト
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, pathname, router])

  // ログインページまたは認証済みの場合は子要素を表示
  if (pathname === '/login' || isAuthenticated) {
    return <>{children}</>
  }

  // 認証チェック中は何も表示しない
  return null
}
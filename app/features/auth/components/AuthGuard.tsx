'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '../store/useAuthStore'
import { isSupabaseEnabled } from '@/app/lib/features'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()

  useEffect(() => {
    // Supabaseが有効な場合のみ認証チェック
    if (isSupabaseEnabled()) {
      checkAuth()
    }
  }, [checkAuth])

  useEffect(() => {
    // Supabaseが無効な場合は認証不要
    if (!isSupabaseEnabled()) {
      return
    }

    // ログインページは認証不要
    if (pathname === '/login') {
      return
    }

    // 認証チェック完了後、未認証の場合はログインページへリダイレクト
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, pathname, router])

  // Supabaseが無効な場合は常に子要素を表示
  if (!isSupabaseEnabled()) {
    return <>{children}</>
  }

  // ローディング中はスピナーを表示
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    )
  }

  // ログインページまたは認証済みの場合は子要素を表示
  if (pathname === '/login' || isAuthenticated) {
    return <>{children}</>
  }

  // 認証チェック中は何も表示しない
  return null
}
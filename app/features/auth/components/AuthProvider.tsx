'use client'

import { useEffect } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { isSupabaseEnabled } from '@/app/lib/features'
import { createClient } from '@/app/lib/supabase/client'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    // Supabaseが有効な場合のみ認証チェック
    if (isSupabaseEnabled()) {
      // 初回ロード時に認証状態をチェック
      checkAuth()

      // Supabaseの認証状態の変更を監視
      const supabase = createClient()
      if (supabase) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event: AuthChangeEvent, session: Session | null) => {
            console.log('Auth state changed:', _event, session?.user?.email)
            // 認証状態が変更されたら再チェック
            await checkAuth()
          }
        )

        return () => {
          subscription.unsubscribe()
        }
      }
    }
  }, [checkAuth])

  return <>{children}</>
}
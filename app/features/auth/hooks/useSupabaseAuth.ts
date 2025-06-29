import { useEffect } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useAuthStore } from '../store/useAuthStore'

export function useSupabaseAuth() {
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    const supabase = createClient()
    if (!supabase) return

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      checkAuth()
    })

    return () => subscription.unsubscribe()
  }, [checkAuth])
}
import { useEffect } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useAuthStore } from '../store/useAuthStore'

export function useSupabaseAuth() {
  const { checkAuth } = useAuthStore()
  const supabase = createClient()

  useEffect(() => {
    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkAuth()
    })

    return () => subscription.unsubscribe()
  }, [checkAuth, supabase.auth])
}
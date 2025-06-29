import { create } from 'zustand'
import { createClient } from '@/app/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  signup: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
}

let supabase: ReturnType<typeof createClient> | null = null

const getSupabase = () => {
  if (!supabase) {
    supabase = createClient()
  }
  return supabase
}

export const useAuthStore = create<AuthState>()(
  (set) => ({
    isAuthenticated: false,
    user: null,
    isLoading: false,
    error: null,
    login: async (email: string, password: string) => {
      const client = getSupabase()
      if (!client) {
        set({ error: 'Authentication service not available', isLoading: false })
        return false
      }
      
      set({ isLoading: true, error: null })
      try {
        const { data, error } = await client.auth.signInWithPassword({
          email,
          password
        })
        
        if (error) {
          set({ error: error.message, isLoading: false })
          return false
        }
        
        if (data.user) {
          set({ 
            isAuthenticated: true, 
            user: data.user,
            isLoading: false 
          })
          return true
        }
        
        return false
      } catch (error) {
        set({ 
          error: 'An unexpected error occurred', 
          isLoading: false 
        })
        return false
      }
    },
    logout: async () => {
      const client = getSupabase()
      if (!client) return
      set({ isLoading: true })
      try {
        await client.auth.signOut()
        set({ 
          isAuthenticated: false, 
          user: null,
          isLoading: false 
        })
      } catch (error) {
        set({ 
          error: 'Failed to logout',
          isLoading: false 
        })
      }
    },
    checkAuth: async () => {
      const client = getSupabase()
      if (!client) {
        set({ isLoading: false })
        return
      }
      
      set({ isLoading: true })
      try {
        const { data: { user } } = await client.auth.getUser()
        
        if (user) {
          set({ 
            isAuthenticated: true, 
            user,
            isLoading: false 
          })
        } else {
          set({ 
            isAuthenticated: false, 
            user: null,
            isLoading: false 
          })
        }
      } catch (error) {
        set({ 
          isAuthenticated: false, 
          user: null,
          isLoading: false 
        })
      }
    },
    signup: async (email: string, password: string) => {
      const client = getSupabase()
      if (!client) {
        set({ error: 'Authentication service not available', isLoading: false })
        return false
      }
      set({ isLoading: true, error: null })
      try {
        const { data, error } = await client.auth.signUp({
          email,
          password
        })
        
        if (error) {
          set({ error: error.message, isLoading: false })
          return false
        }
        
        if (data.user) {
          set({ 
            isAuthenticated: true, 
            user: data.user,
            isLoading: false 
          })
          return true
        }
        
        return false
      } catch (error) {
        set({ 
          error: 'An unexpected error occurred', 
          isLoading: false 
        })
        return false
      }
    },
    clearError: () => set({ error: null })
  })
)
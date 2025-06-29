import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  isAuthenticated: boolean
  user: { email: string } | null
  login: (email: string, password: string) => boolean
  logout: () => void
}

// 仮の認証情報
const MOCK_CREDENTIALS = {
  email: 'user@example.com',
  password: 'password123'
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (email: string, password: string) => {
        // 仮の認証チェック
        if (email === MOCK_CREDENTIALS.email && password === MOCK_CREDENTIALS.password) {
          set({ isAuthenticated: true, user: { email } })
          return true
        }
        return false
      },
      logout: () => {
        set({ isAuthenticated: false, user: null })
      }
    }),
    {
      name: 'auth-storage'
    }
  )
)
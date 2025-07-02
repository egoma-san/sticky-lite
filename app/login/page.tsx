'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../features/auth/store/useAuthStore'
import Link from 'next/link'
import { useIPRestriction } from '../features/auth/hooks/useIPRestriction'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSignup, setIsSignup] = useState(false)
  const router = useRouter()
  const { login, signup, isLoading, error, clearError } = useAuthStore()
  const { isIPAllowed, isLoading: isIPCheckLoading } = useIPRestriction()

  // Redirect to home if IP is not allowed
  useEffect(() => {
    if (!isIPCheckLoading && !isIPAllowed) {
      router.push('/')
    }
  }, [isIPAllowed, isIPCheckLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    
    const success = isSignup 
      ? await signup(email, password)
      : await login(email, password)
    
    if (success) {
      router.push('/')
    }
  }

  // Show loading state while checking IP
  if (isIPCheckLoading) {
    return (
      <div className="min-h-screen h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">アクセス権限を確認中...</p>
        </div>
      </div>
    )
  }

  // Don't render login form if IP is not allowed
  if (!isIPAllowed) {
    return null
  }

  return (
    <div className="min-h-screen h-screen bg-gray-50 flex flex-col items-center justify-start sm:justify-center px-4 pt-12 pb-8 sm:py-8 overflow-hidden">
      <div className="w-full max-w-md space-y-3 sm:space-y-6 lg:space-y-8 mt-8 sm:mt-0">
        {/* Logo area with rounded squares */}
        <div className="flex justify-center items-center gap-2">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-400 rounded-2xl animate-pulse" />
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-400 rounded-2xl animate-pulse delay-75" />
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-400 rounded-2xl animate-pulse delay-150" />
        </div>

        {/* Login form */}
        <div className="bg-white rounded-3xl shadow-lg p-5 sm:p-8 space-y-3 sm:space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-800">
            {isSignup ? '新規登録' : 'ログイン'}
          </h2>

          {/* エラーメッセージ */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-2 sm:p-3 text-xs sm:text-sm text-red-700">
              {error}
              {error === 'メールを確認してアカウントを有効化してください' && (
                <p className="mt-2 text-xs">
                  登録したメールアドレスに確認メールが送信されました。メール内のリンクをクリックしてアカウントを有効化してください。
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="メールアドレス"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border border-gray-300 text-gray-800 bg-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="relative">
              <label htmlFor="password" className="sr-only">
                パスワード
              </label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワード"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-12 rounded-2xl border border-gray-300 text-gray-800 bg-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 sm:py-3 px-4 rounded-2xl bg-blue-500 text-white text-sm sm:text-base font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isSignup ? '登録中...' : 'ログイン中...'}
                </span>
              ) : (
                isSignup ? '新規登録' : 'ログイン'
              )}
            </button>
          </form>

          <div className="space-y-2">
            {!isSignup && (
              <button className="w-full text-xs sm:text-sm text-blue-600 hover:text-blue-800 transition-colors">
                パスワードを忘れた方
              </button>
            )}
            <div className="text-center text-xs sm:text-sm text-gray-600">
              {isSignup ? (
                <>
                  すでにアカウントをお持ちの方は
                  <button 
                    onClick={() => {
                      setIsSignup(false)
                      clearError()
                    }}
                    className="text-blue-600 hover:text-blue-800 ml-1 transition-colors"
                  >
                    ログイン
                  </button>
                </>
              ) : (
                <>
                  アカウントをお持ちでない方は
                  <button 
                    onClick={() => {
                      setIsSignup(true)
                      clearError()
                    }}
                    className="text-blue-600 hover:text-blue-800 ml-1 transition-colors"
                  >
                    新規登録
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Login benefits */}
        <div className="bg-blue-50 rounded-2xl p-4 space-y-2">
          <h3 className="text-sm font-semibold text-blue-900">ログインすると...</h3>
          <ul className="space-y-1 text-xs text-blue-800">
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>付箋がクラウドに自動保存され、データを失う心配がありません</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>スマホ・タブレット・PCなど複数の端末で同期できます</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>近日公開：共有機能、タグ機能、検索機能など</span>
            </li>
          </ul>
        </div>

        {/* Skip login option */}
        <div className="text-center">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-sm sm:text-base text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            ログインせずに使う
          </Link>
          <p className="text-xs text-gray-500 mt-2">
            （データはブラウザに保存されます）
          </p>
        </div>

        {/* Decorative rounded squares - hidden on small screens */}
        <div className="hidden sm:flex justify-center items-center gap-4">
          <div className="w-8 h-8 bg-gray-200 rounded-xl" />
          <div className="w-8 h-8 bg-gray-300 rounded-xl" />
          <div className="w-8 h-8 bg-gray-200 rounded-xl" />
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-2 sm:bottom-4 text-gray-400 text-xs sm:text-sm">
        egoma.org
      </div>
    </div>
  )
}
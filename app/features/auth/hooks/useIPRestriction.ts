import { useState, useEffect } from 'react'

export function useIPRestriction() {
  const [isIPAllowed, setIsIPAllowed] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkIP = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/check-ip')
        
        if (!response.ok) {
          throw new Error('Failed to check IP restriction')
        }
        
        const data = await response.json()
        setIsIPAllowed(data.isAllowed)
        
        // 開発環境でのデバッグ情報
        if (process.env.NODE_ENV === 'development' && data.clientIP) {
          console.log('Client IP:', data.clientIP)
          console.log('IP Allowed:', data.isAllowed)
          console.log('Allowed IPs:', data.allowedIPs)
        }
      } catch (err) {
        console.error('Error checking IP restriction:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        // エラーの場合は安全のため許可しない
        setIsIPAllowed(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkIP()
  }, [])

  return { isIPAllowed, isLoading, error }
}
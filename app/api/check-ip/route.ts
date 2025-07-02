import { NextRequest, NextResponse } from 'next/server'

// 許可するIPアドレスのリスト
// 環境変数から読み込むか、ここに直接定義
const ALLOWED_IPS = process.env.ALLOWED_IPS?.split(',').map(ip => ip.trim()) || [
  // 例: 開発環境のローカルIP
  '::1', // IPv6 localhost
  '127.0.0.1', // IPv4 localhost
  // 本番環境で許可したいIPアドレスをここに追加
  '133.155.80.239', // 許可されたIPアドレス
]

// CIDR記法をサポートするための簡易的な実装
function isIPInRange(ip: string, range: string): boolean {
  if (!range.includes('/')) {
    return ip === range
  }
  
  // 簡易的なCIDRチェック（IPv4のみ）
  const [rangeIP, maskBits] = range.split('/')
  const mask = parseInt(maskBits)
  
  if (isNaN(mask) || mask < 0 || mask > 32) {
    return false
  }
  
  // IPv4アドレスを数値に変換
  const ipToNumber = (addr: string): number => {
    const parts = addr.split('.')
    if (parts.length !== 4) return -1
    
    return parts.reduce((acc, part, i) => {
      const num = parseInt(part)
      if (isNaN(num) || num < 0 || num > 255) return -1
      return acc + (num << (8 * (3 - i)))
    }, 0)
  }
  
  const ipNum = ipToNumber(ip)
  const rangeNum = ipToNumber(rangeIP)
  
  if (ipNum === -1 || rangeNum === -1) {
    return false
  }
  
  const maskNum = (0xFFFFFFFF << (32 - mask)) >>> 0
  return (ipNum & maskNum) === (rangeNum & maskNum)
}

function checkIPAllowed(ip: string): boolean {
  // IPアドレスが不明な場合は許可しない
  if (!ip || ip === 'unknown') {
    return false
  }
  
  // 許可リストに含まれているかチェック
  return ALLOWED_IPS.some(allowedIP => {
    if (allowedIP.includes('/')) {
      // CIDR記法の場合
      return isIPInRange(ip, allowedIP)
    }
    // 完全一致
    return ip === allowedIP
  })
}

export async function GET(request: NextRequest) {
  // クライアントのIPアドレスを取得
  // プロキシやロードバランサーを経由している場合を考慮
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  // 複数のプロキシを経由している場合、最初のIPを取得
  const clientIP = forwardedFor?.split(',')[0].trim() || 
                   realIP || 
                   'unknown'
  
  const isAllowed = checkIPAllowed(clientIP)
  
  // レスポンスを返す
  const response = {
    isAllowed,
    // 開発環境でのみIPアドレスを返す（デバッグ用）
    ...(process.env.NODE_ENV === 'development' && { 
      clientIP,
      allowedIPs: ALLOWED_IPS 
    })
  }
  
  return NextResponse.json(response)
}
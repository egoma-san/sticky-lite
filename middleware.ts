import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Basic認証の認証情報（環境変数から取得）
const BASIC_AUTH_USER = process.env.BASIC_AUTH_USER || 'admin'
const BASIC_AUTH_PASS = process.env.BASIC_AUTH_PASS || 'password'

export function middleware(request: NextRequest) {
  // Basic認証のヘッダーを取得
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    // 認証ヘッダーがない場合は401を返す
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    })
  }

  // Basic認証の認証情報をデコード
  const base64Credentials = authHeader.split(' ')[1]
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8')
  const [username, password] = credentials.split(':')

  // 認証情報を確認
  if (username !== BASIC_AUTH_USER || password !== BASIC_AUTH_PASS) {
    return new NextResponse('Invalid credentials', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    })
  }

  // 認証成功
  return NextResponse.next()
}

// 認証を適用するパスを設定
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
'use client'

export default function EnvironmentCheck() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // 開発環境でのみ表示
  if (process.env.NODE_ENV !== 'development') {
    return null
  }
  
  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs">
      <h3 className="font-bold mb-2">環境変数の状態（開発環境のみ）</h3>
      <p>NEXT_PUBLIC_SUPABASE_URL: {supabaseUrl ? '✅ 設定済み' : '❌ 未設定'}</p>
      <p>NEXT_PUBLIC_SUPABASE_ANON_KEY: {supabaseKey ? '✅ 設定済み' : '❌ 未設定'}</p>
      {(!supabaseUrl || !supabaseKey) && (
        <div className="mt-2 text-red-600">
          <p className="font-bold">環境変数が設定されていません。</p>
          <p>1. `.env.local`ファイルを作成してください</p>
          <p>2. Supabaseの認証情報を設定してください</p>
          <p>3. サーバーを再起動してください</p>
        </div>
      )}
    </div>
  )
}
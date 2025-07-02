// Feature flags to control app functionality based on environment

// ログイン機能の有効/無効を切り替えるフラグ
// true に変更すると公開される
const ENABLE_LOGIN_FEATURE = true

export const features = {
  // Check if Supabase is configured
  supabase: {
    enabled: !!(
      ENABLE_LOGIN_FEATURE &&
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }
}

export function isSupabaseEnabled() {
  return features.supabase.enabled
}
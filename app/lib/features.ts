// Feature flags to control app functionality based on environment

export const features = {
  // Check if Supabase is configured
  supabase: {
    enabled: !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }
}

export function isSupabaseEnabled() {
  return features.supabase.enabled
}
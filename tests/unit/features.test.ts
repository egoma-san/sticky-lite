import { isSupabaseEnabled } from '../../app/lib/features'

describe('features', () => {
  it('should check for Supabase environment variables', () => {
    // Just test that the function exists and returns a boolean
    const result = isSupabaseEnabled()
    expect(typeof result).toBe('boolean')
  })
})
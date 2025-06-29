// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock crypto.randomUUID for tests
global.crypto = {
  randomUUID: () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Mock Supabase modules
jest.mock('@supabase/ssr')
jest.mock('@supabase/supabase-js')

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
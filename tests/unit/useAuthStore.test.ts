import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '../../app/features/auth/store/useAuthStore'

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null
    })
  })

  it('should have initial state', () => {
    const { result } = renderHook(() => useAuthStore())

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should clear error', () => {
    const { result } = renderHook(() => useAuthStore())
    
    // Set error
    act(() => {
      useAuthStore.setState({ error: 'Test error' })
    })

    expect(result.current.error).toBe('Test error')

    // Clear error
    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
  })

  it('should handle authentication state changes', () => {
    const { result } = renderHook(() => useAuthStore())
    
    // Set authenticated state
    act(() => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: { id: '123', email: 'test@example.com' } as any
      })
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toEqual({
      id: '123',
      email: 'test@example.com'
    })
  })

  it('should handle loading state', () => {
    const { result } = renderHook(() => useAuthStore())
    
    // Set loading state
    act(() => {
      useAuthStore.setState({ isLoading: true })
    })

    expect(result.current.isLoading).toBe(true)

    // Clear loading state
    act(() => {
      useAuthStore.setState({ isLoading: false })
    })

    expect(result.current.isLoading).toBe(false)
  })
})
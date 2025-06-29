import React from 'react'
import { render } from '@testing-library/react'
import AuthGuard from '../../app/features/auth/components/AuthGuard'
import { useAuthStore } from '../../app/features/auth/store/useAuthStore'

// Mock the auth store
jest.mock('../../app/features/auth/store/useAuthStore')

// Mock next/navigation
const mockPush = jest.fn()
const mockPathname = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockPathname()
}))

describe('AuthGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render children when authenticated', () => {
    mockPathname.mockReturnValue('/')
    ;(useAuthStore as jest.Mock).mockReturnValue({
      isAuthenticated: true
    })

    const { getByText } = render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    )

    expect(getByText('Protected Content')).toBeInTheDocument()
  })

  it('should redirect to login when not authenticated', () => {
    mockPathname.mockReturnValue('/')
    ;(useAuthStore as jest.Mock).mockReturnValue({
      isAuthenticated: false
    })

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    )

    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  it('should allow access to login page without authentication', () => {
    mockPathname.mockReturnValue('/login')
    ;(useAuthStore as jest.Mock).mockReturnValue({
      isAuthenticated: false
    })

    const { getByText } = render(
      <AuthGuard>
        <div>Login Page</div>
      </AuthGuard>
    )

    expect(getByText('Login Page')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })
})
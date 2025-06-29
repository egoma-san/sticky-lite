import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '../../app/login/page'
import { useAuthStore } from '../../app/features/auth/store/useAuthStore'

// Mock the auth store
jest.mock('../../app/features/auth/store/useAuthStore')

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('LoginPage', () => {
  const mockLogin = jest.fn()
  const mockSignup = jest.fn()
  const mockClearError = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuthStore as jest.Mock).mockReturnValue({
      login: mockLogin,
      signup: mockSignup,
      clearError: mockClearError,
      isLoading: false,
      error: null
    })
  })

  it('should render login form', () => {
    render(<LoginPage />)
    
    expect(screen.getByRole('heading', { name: 'ログイン' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('メールアドレス')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('パスワード')).toBeInTheDocument()
  })

  it('should handle successful login', async () => {
    mockLogin.mockResolvedValue(true)
    const user = userEvent.setup()
    
    render(<LoginPage />)
    
    const emailInput = screen.getByPlaceholderText('メールアドレス')
    const passwordInput = screen.getByPlaceholderText('パスワード')
    const submitButton = screen.getByRole('button', { name: 'ログイン' })
    
    await user.type(emailInput, 'user@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'password123')
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  it('should show error on failed login', async () => {
    mockLogin.mockResolvedValue(false)
    ;(useAuthStore as jest.Mock).mockReturnValue({
      login: mockLogin,
      signup: mockSignup,
      clearError: mockClearError,
      isLoading: false,
      error: 'Invalid credentials'
    })
    
    const user = userEvent.setup()
    
    render(<LoginPage />)
    
    const emailInput = screen.getByPlaceholderText('メールアドレス')
    const passwordInput = screen.getByPlaceholderText('パスワード')
    const submitButton = screen.getByRole('button', { name: 'ログイン' })
    
    await user.type(emailInput, 'wrong@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('should toggle password visibility', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    
    const passwordInput = screen.getByPlaceholderText('パスワード')
    // Find the button that is a sibling of the password input
    const toggleButton = passwordInput.parentElement?.querySelector('button[type="button"]') as HTMLElement
    
    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password')
    
    // Click to show password
    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')
    
    // Click again to hide password
    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('should show loading state while submitting', async () => {
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)))
    ;(useAuthStore as jest.Mock).mockReturnValueOnce({
      login: mockLogin,
      signup: mockSignup,
      clearError: mockClearError,
      isLoading: false,
      error: null
    }).mockReturnValueOnce({
      login: mockLogin,
      signup: mockSignup,
      clearError: mockClearError,
      isLoading: true,
      error: null
    })
    
    const user = userEvent.setup()
    
    const { rerender } = render(<LoginPage />)
    
    const emailInput = screen.getByPlaceholderText('メールアドレス')
    const passwordInput = screen.getByPlaceholderText('パスワード')
    const submitButton = screen.getByRole('button', { name: 'ログイン' })
    
    await user.type(emailInput, 'user@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    rerender(<LoginPage />)
    
    // Should show loading state
    expect(screen.getByText('ログイン中...')).toBeInTheDocument()
  })

  it('should have correct text color for inputs', () => {
    render(<LoginPage />)
    
    const emailInput = screen.getByPlaceholderText('メールアドレス')
    const passwordInput = screen.getByPlaceholderText('パスワード')
    
    expect(emailInput).toHaveClass('text-gray-800')
    expect(passwordInput).toHaveClass('text-gray-800')
  })
})
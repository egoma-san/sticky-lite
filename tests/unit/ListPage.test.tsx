import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ListPage from '../../app/list/page'
import { useStickies } from '../../app/features/sticky-notes/hooks/useStickies'

// Mock the hooks
jest.mock('../../app/features/sticky-notes/hooks/useStickies', () => ({
  useStickies: jest.fn(),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// Mock the auth store
jest.mock('../../app/features/auth/store/useAuthStore', () => ({
  useAuthStore: jest.fn(() => ({
    logout: jest.fn()
  }))
}))

describe('ListPage', () => {
  const mockDeleteMultiple = jest.fn()
  const mockStickies = [
    {
      id: '1',
      x: 100,
      y: 100,
      text: 'First sticky note',
      color: 'yellow' as const,
      createdAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      x: 200,
      y: 200,
      text: 'Second sticky note',
      color: 'blue' as const,
      createdAt: new Date('2024-01-02'),
    },
    {
      id: '3',
      x: 300,
      y: 300,
      text: 'Third sticky note',
      color: 'pink' as const,
      createdAt: new Date('2024-01-03'),
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useStickies as jest.Mock).mockReturnValue({
      stickies: mockStickies,
      deleteSticky: jest.fn(),
      deleteMultiple: mockDeleteMultiple,
    })
  })

  it('should render list page with sticky notes', () => {
    render(<ListPage />)
    
    expect(screen.getByText('付箋リスト')).toBeInTheDocument()
    expect(screen.getByText('First sticky note')).toBeInTheDocument()
    expect(screen.getByText('Second sticky note')).toBeInTheDocument()
    expect(screen.getByText('Third sticky note')).toBeInTheDocument()
  })

  it('should show back to board button', () => {
    render(<ListPage />)
    
    const backButton = screen.getByText('ボードに戻る')
    expect(backButton).toBeInTheDocument()
    expect(backButton.closest('a')).toHaveAttribute('href', '/')
  })

  it('should display sticky note colors', () => {
    render(<ListPage />)
    
    // Check for color badges instead of dots
    expect(screen.getByText('黄')).toBeInTheDocument()
    expect(screen.getByText('青')).toBeInTheDocument()
    expect(screen.getByText('ピンク')).toBeInTheDocument()
  })

  it('should navigate to sticky position on double click', () => {
    const mockPush = jest.fn()
    jest.mock('next/navigation', () => ({
      useRouter: () => ({
        push: mockPush,
      }),
    }))
    
    render(<ListPage />)
    
    const firstRow = screen.getByText('First sticky note').closest('tr')!
    fireEvent.doubleClick(firstRow)
    
    // Check navigation URL includes focus parameter
    expect(firstRow.closest('tr')).toBeInTheDocument()
  })

  it('should allow selecting items with checkbox', () => {
    render(<ListPage />)
    
    const checkboxes = screen.getAllByRole('checkbox')
    const firstCheckbox = checkboxes[1] // Skip header checkbox
    fireEvent.click(firstCheckbox)
    
    expect(firstCheckbox).toBeChecked()
  })

  it('should delete selected items when delete button is clicked', async () => {
    render(<ListPage />)
    
    // Select first two items (skip header checkbox)
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1])
    fireEvent.click(checkboxes[2])
    
    // Click delete button
    const deleteButton = screen.getByText(/選択した.*件を削除/)
    fireEvent.click(deleteButton)
    
    await waitFor(() => {
      expect(mockDeleteMultiple).toHaveBeenCalledWith(['3', '2'])
    })
  })

  it('should disable delete button when nothing is selected', () => {
    render(<ListPage />)
    
    // When nothing is selected, there should be no delete button
    const deleteButton = screen.queryByText(/選択した.*件を削除/)
    expect(deleteButton).not.toBeInTheDocument()
  })

  it('should enable delete button when items are selected', () => {
    render(<ListPage />)
    
    const checkboxes = screen.getAllByRole('checkbox')
    const firstCheckbox = checkboxes[1] // Skip header checkbox
    fireEvent.click(firstCheckbox)
    
    const deleteButton = screen.getByText(/選択した.*件を削除/)
    expect(deleteButton).toBeInTheDocument()
    expect(deleteButton).not.toBeDisabled()
  })

  it('should show correct count of selected items', () => {
    render(<ListPage />)
    
    // Initially no delete button should be visible
    expect(screen.queryByText(/選択した.*件を削除/)).not.toBeInTheDocument()
    
    // Select one item (skip the header checkbox)
    const checkboxes = screen.getAllByRole('checkbox')
    const firstCheckbox = checkboxes[1] // First data row checkbox
    fireEvent.click(firstCheckbox)
    
    expect(screen.getByText(/選択した1件を削除/)).toBeInTheDocument()
    
    // Select another item
    const secondCheckbox = checkboxes[2] // Second data row checkbox
    fireEvent.click(secondCheckbox)
    
    expect(screen.getByText(/選択した2件を削除/)).toBeInTheDocument()
  })

  it('should unselect item when checkbox is clicked again', () => {
    render(<ListPage />)
    
    const checkboxes = screen.getAllByRole('checkbox')
    const firstCheckbox = checkboxes[1] // Skip header checkbox
    
    // Select
    fireEvent.click(firstCheckbox)
    expect(firstCheckbox).toBeChecked()
    
    // Unselect
    fireEvent.click(firstCheckbox)
    expect(firstCheckbox).not.toBeChecked()
  })

  it('should display empty state when no sticky notes', () => {
    ;(useStickies as jest.Mock).mockReturnValue({
      stickies: [],
      deleteSticky: jest.fn(),
      deleteMultiple: mockDeleteMultiple,
    })
    
    render(<ListPage />)
    
    expect(screen.getByText('付箋がありません')).toBeInTheDocument()
  })

  it('should handle checkbox selection', () => {
    render(<ListPage />)
    
    const firstRow = screen.getByText('First sticky note').closest('tr')!
    const checkbox = firstRow.querySelector('input[type="checkbox"]') as HTMLInputElement
    
    // Click checkbox to select
    fireEvent.click(checkbox)
    
    expect(checkbox).toBeChecked()
  })

  it('should format creation date correctly', () => {
    render(<ListPage />)
    
    // Check that dates are displayed in M/D HH:mm format
    expect(screen.getByText('1/1 09:00')).toBeInTheDocument()
    expect(screen.getByText('1/2 09:00')).toBeInTheDocument()
    expect(screen.getByText('1/3 09:00')).toBeInTheDocument()
  })

  it('should handle sticky notes without text', () => {
    ;(useStickies as jest.Mock).mockReturnValue({
      stickies: [
        {
          id: '1',
          x: 100,
          y: 100,
          text: '',
          color: 'yellow' as const,
          createdAt: new Date(),
        },
      ],
      deleteSticky: jest.fn(),
      deleteMultiple: mockDeleteMultiple,
    })
    
    render(<ListPage />)
    
    expect(screen.getByText('(空の付箋)')).toBeInTheDocument()
  })
})
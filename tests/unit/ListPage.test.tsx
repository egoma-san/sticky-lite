import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ListPage from '../../app/list/page'
import { useStickyStore } from '../../app/features/sticky-notes/store/useStickyStore'

// Mock the store
jest.mock('../../app/features/sticky-notes/store/useStickyStore', () => ({
  useStickyStore: jest.fn(),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
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
    ;(useStickyStore as jest.Mock).mockReturnValue({
      stickies: mockStickies,
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
    
    const yellowDot = screen.getByText('First sticky note').closest('tr')?.querySelector('.bg-yellow-400')
    const blueDot = screen.getByText('Second sticky note').closest('tr')?.querySelector('.bg-blue-400')
    const pinkDot = screen.getByText('Third sticky note').closest('tr')?.querySelector('.bg-pink-400')
    
    expect(yellowDot).toBeInTheDocument()
    expect(blueDot).toBeInTheDocument()
    expect(pinkDot).toBeInTheDocument()
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
    
    const firstCheckbox = screen.getAllByRole('checkbox')[0]
    fireEvent.click(firstCheckbox)
    
    expect(firstCheckbox).toBeChecked()
  })

  it('should delete selected items when delete button is clicked', async () => {
    render(<ListPage />)
    
    // Select first two items
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0])
    fireEvent.click(checkboxes[1])
    
    // Click delete button
    const deleteButton = screen.getByText('選択した付箋を削除')
    fireEvent.click(deleteButton)
    
    await waitFor(() => {
      expect(mockDeleteMultiple).toHaveBeenCalledWith(['1', '2'])
    })
  })

  it('should disable delete button when nothing is selected', () => {
    render(<ListPage />)
    
    const deleteButton = screen.getByText('選択した付箋を削除')
    expect(deleteButton).toBeDisabled()
  })

  it('should enable delete button when items are selected', () => {
    render(<ListPage />)
    
    const firstCheckbox = screen.getAllByRole('checkbox')[0]
    fireEvent.click(firstCheckbox)
    
    const deleteButton = screen.getByText('選択した付箋を削除')
    expect(deleteButton).not.toBeDisabled()
  })

  it('should show correct count of selected items', () => {
    render(<ListPage />)
    
    // Initially no items selected
    expect(screen.getByText('0 個選択中')).toBeInTheDocument()
    
    // Select one item
    const firstCheckbox = screen.getAllByRole('checkbox')[0]
    fireEvent.click(firstCheckbox)
    
    expect(screen.getByText('1 個選択中')).toBeInTheDocument()
    
    // Select another item
    const secondCheckbox = screen.getAllByRole('checkbox')[1]
    fireEvent.click(secondCheckbox)
    
    expect(screen.getByText('2 個選択中')).toBeInTheDocument()
  })

  it('should unselect item when checkbox is clicked again', () => {
    render(<ListPage />)
    
    const firstCheckbox = screen.getAllByRole('checkbox')[0]
    
    // Select
    fireEvent.click(firstCheckbox)
    expect(firstCheckbox).toBeChecked()
    
    // Unselect
    fireEvent.click(firstCheckbox)
    expect(firstCheckbox).not.toBeChecked()
  })

  it('should display empty state when no sticky notes', () => {
    ;(useStickyStore as jest.Mock).mockReturnValue({
      stickies: [],
      deleteMultiple: mockDeleteMultiple,
    })
    
    render(<ListPage />)
    
    expect(screen.getByText('付箋がありません')).toBeInTheDocument()
  })

  it('should handle keyboard navigation', () => {
    render(<ListPage />)
    
    const firstRow = screen.getByText('First sticky note').closest('tr')!
    
    // Focus on the row
    firstRow.focus()
    
    // Press Enter to toggle selection
    fireEvent.keyDown(firstRow, { key: 'Enter' })
    
    const checkbox = firstRow.querySelector('input[type="checkbox"]') as HTMLInputElement
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
    ;(useStickyStore as jest.Mock).mockReturnValue({
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
      deleteMultiple: mockDeleteMultiple,
    })
    
    render(<ListPage />)
    
    expect(screen.getByText('(空の付箋)')).toBeInTheDocument()
  })
})
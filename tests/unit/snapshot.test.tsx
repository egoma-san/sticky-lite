import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import SnapshotModal from '@/app/features/snapshots/components/SnapshotModal'
import { useSnapshots } from '@/app/features/snapshots/hooks/useSnapshots'
import { sanitizeSticky, sanitizeStickies } from '@/app/features/snapshots/utils/sanitizer'

// Mock the hooks
jest.mock('@/app/features/snapshots/hooks/useSnapshots')
jest.mock('@/app/features/sticky-notes/hooks/useStickies', () => ({
  useStickies: () => ({
    stickies: [
      { id: '1', x: 100, y: 100, text: 'Test note', color: 'yellow' }
    ]
  })
}))
jest.mock('@/app/features/sticky-notes/store/useStickyStore', () => ({
  useStickyStore: {
    getState: () => ({
      stickies: [],
      clearAll: jest.fn(),
      addSticky: jest.fn(),
      updateStickyText: jest.fn(),
      updateStickySize: jest.fn(),
      updateStickyFontSize: jest.fn(),
      updateStickyFormat: jest.fn()
    })
  }
}))

describe('Snapshot functionality', () => {
  const mockSaveSnapshot = jest.fn()
  const mockLoadSnapshot = jest.fn()
  const mockDeleteSnapshot = jest.fn()
  const mockClearError = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    ;(useSnapshots as jest.Mock).mockReturnValue({
      snapshots: [],
      isLoading: false,
      error: null,
      maxSnapshots: 5,
      canSaveMore: true,
      saveSnapshot: mockSaveSnapshot,
      loadSnapshot: mockLoadSnapshot,
      deleteSnapshot: mockDeleteSnapshot,
      clearError: mockClearError
    })
  })
  
  test('renders snapshot modal', () => {
    render(<SnapshotModal onClose={jest.fn()} />)
    
    expect(screen.getByText('スナップショット')).toBeInTheDocument()
    expect(screen.getByText(/現在の状態を保存して、後で復元できます/)).toBeInTheDocument()
  })
  
  test('shows save form when clicking save button', () => {
    render(<SnapshotModal onClose={jest.fn()} />)
    
    const saveButton = screen.getByText('新しいスナップショットを保存')
    fireEvent.click(saveButton)
    
    expect(screen.getByPlaceholderText('名前を入力')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('説明（任意）')).toBeInTheDocument()
  })
  
  test('saves snapshot with name and description', async () => {
    render(<SnapshotModal onClose={jest.fn()} />)
    
    // Open save form
    fireEvent.click(screen.getByText('新しいスナップショットを保存'))
    
    // Fill in form
    const nameInput = screen.getByPlaceholderText('名前を入力')
    const descInput = screen.getByPlaceholderText('説明（任意）')
    
    fireEvent.change(nameInput, { target: { value: 'Test Snapshot' } })
    fireEvent.change(descInput, { target: { value: 'Test description' } })
    
    // Save
    fireEvent.click(screen.getByText('保存'))
    
    await waitFor(() => {
      expect(mockSaveSnapshot).toHaveBeenCalledWith('Test Snapshot', 'Test description')
    })
  })
  
  test('displays error message', () => {
    ;(useSnapshots as jest.Mock).mockReturnValue({
      snapshots: [],
      isLoading: false,
      error: 'Failed to save',
      maxSnapshots: 5,
      canSaveMore: true,
      saveSnapshot: mockSaveSnapshot,
      loadSnapshot: mockLoadSnapshot,
      deleteSnapshot: mockDeleteSnapshot,
      clearError: mockClearError
    })
    
    render(<SnapshotModal onClose={jest.fn()} />)
    
    expect(screen.getByText('Failed to save')).toBeInTheDocument()
  })
})

describe('Data sanitization', () => {
  test('sanitizes sticky data correctly', () => {
    const dirty = {
      id: '<script>alert("xss")</script>',
      x: '100',
      y: '200',
      text: 'Hello'.repeat(1000), // Very long text
      color: 'invalid-color',
      size: 10, // Out of range
      fontSize: 100, // Out of range
      richText: '<script>alert("xss")</script><b>Bold</b>'
    }
    
    const clean = sanitizeSticky(dirty)
    
    expect(clean.id).not.toContain('<script>')
    expect(clean.x).toBe(100)
    expect(clean.y).toBe(200)
    expect(clean.text.length).toBeLessThanOrEqual(5000)
    expect(clean.color).toBe('yellow') // Default color
    expect(clean.size).toBe(3) // Max size
    expect(clean.fontSize).toBe(64) // Max font size
    expect(clean.richText).toBe('<b>Bold</b>') // Script tag removed
  })
  
  test('sanitizes array of stickies', () => {
    const dirtyArray = [
      { id: '1', x: 100, y: 100, text: 'Clean', color: 'yellow' },
      { id: '2', x: 200, y: 200, text: '<script>alert("xss")</script>', color: 'blue' },
      null, // Invalid item
      { invalid: 'object' } // Missing required fields
    ]
    
    const clean = sanitizeStickies(dirtyArray)
    
    expect(clean).toHaveLength(2) // Only valid items
    expect(clean[0].text).toBe('Clean')
    expect(clean[1].text).toBe('<script>alert("xss")</script>') // Text field is not HTML sanitized, only richText is
  })
})
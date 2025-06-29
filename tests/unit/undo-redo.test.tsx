import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import Board from '@/app/features/sticky-notes/components/Board'
import { useStickiesWithUndo } from '@/app/features/sticky-notes/hooks/useStickiesWithUndo'
import { useUndoStore } from '@/app/features/sticky-notes/store/useUndoStore'

// Mock the hooks and modules
jest.mock('@/app/features/sticky-notes/hooks/useStickiesWithUndo')
jest.mock('@/app/features/sticky-notes/store/useUndoStore')
jest.mock('@/app/features/auth/store/useAuthStore', () => ({
  useAuthStore: () => ({
    logout: jest.fn(),
    isAuthenticated: false,
    user: null
  })
}))
jest.mock('@/app/lib/features', () => ({
  isSupabaseEnabled: () => false
}))
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => ({ get: () => null })
}))

// Mock audio utils
jest.mock('@/app/features/sticky-notes/utils/deletionSounds', () => ({
  playPaperSound: jest.fn()
}))
jest.mock('@/app/features/sticky-notes/utils/origamiSounds', () => ({
  playOrigamiSound: jest.fn()
}))

describe('Undo/Redo functionality', () => {
  let mockStickies: any[]
  let mockRestoreState: jest.Mock
  let mockUndo: jest.Mock
  let mockRedo: jest.Mock
  let mockAddToHistory: jest.Mock

  beforeEach(() => {
    mockStickies = [
      {
        id: '1',
        x: 100,
        y: 100,
        text: 'Test note',
        color: 'yellow',
        size: 1,
        fontSize: 16
      }
    ]

    mockRestoreState = jest.fn()
    mockUndo = jest.fn()
    mockRedo = jest.fn()
    mockAddToHistory = jest.fn()

    ;(useStickiesWithUndo as jest.Mock).mockReturnValue({
      stickies: mockStickies,
      addSticky: jest.fn(),
      updateStickyText: jest.fn(),
      updateStickyPosition: jest.fn(),
      updateStickySize: jest.fn(),
      updateStickyColor: jest.fn(),
      updateStickyFontSize: jest.fn(),
      updateStickyFormat: jest.fn(),
      deleteSticky: jest.fn(),
      deleteMultiple: jest.fn(),
      restoreState: mockRestoreState,
      isLoading: false
    })

    ;(useUndoStore as jest.Mock).mockReturnValue({
      addToHistory: mockAddToHistory,
      undo: mockUndo,
      redo: mockRedo,
      isUndoAvailable: true,
      isRedoAvailable: false
    })
  })

  test('Cmd/Ctrl + Z triggers undo', () => {
    mockUndo.mockReturnValue([{ id: '1', x: 50, y: 50, text: 'Previous state' }])
    
    render(<Board />)
    
    // Press Cmd/Ctrl + Z
    fireEvent.keyDown(window, {
      key: 'z',
      ctrlKey: true
    })
    
    expect(mockUndo).toHaveBeenCalled()
    expect(mockRestoreState).toHaveBeenCalledWith([{ id: '1', x: 50, y: 50, text: 'Previous state' }])
  })

  test('Cmd/Ctrl + Shift + Z triggers redo', () => {
    ;(useUndoStore as jest.Mock).mockReturnValue({
      addToHistory: mockAddToHistory,
      undo: mockUndo,
      redo: mockRedo,
      isUndoAvailable: false,
      isRedoAvailable: true
    })
    
    mockRedo.mockReturnValue([{ id: '1', x: 150, y: 150, text: 'Next state' }])
    
    render(<Board />)
    
    // Press Cmd/Ctrl + Shift + Z
    fireEvent.keyDown(window, {
      key: 'z',
      shiftKey: true,
      ctrlKey: true
    })
    
    expect(mockRedo).toHaveBeenCalled()
    expect(mockRestoreState).toHaveBeenCalledWith([{ id: '1', x: 150, y: 150, text: 'Next state' }])
  })

  test('Cmd/Ctrl + Y also triggers redo', () => {
    ;(useUndoStore as jest.Mock).mockReturnValue({
      addToHistory: mockAddToHistory,
      undo: mockUndo,
      redo: mockRedo,
      isUndoAvailable: false,
      isRedoAvailable: true
    })
    
    mockRedo.mockReturnValue([{ id: '1', x: 150, y: 150, text: 'Next state' }])
    
    render(<Board />)
    
    // Press Cmd/Ctrl + Y
    fireEvent.keyDown(window, {
      key: 'y',
      ctrlKey: true
    })
    
    expect(mockRedo).toHaveBeenCalled()
    expect(mockRestoreState).toHaveBeenCalledWith([{ id: '1', x: 150, y: 150, text: 'Next state' }])
  })

  test('Delete key does not work when editing', () => {
    const mockDeleteSticky = jest.fn()
    
    ;(useStickiesWithUndo as jest.Mock).mockReturnValue({
      stickies: mockStickies,
      addSticky: jest.fn(),
      updateStickyText: jest.fn(),
      updateStickyPosition: jest.fn(),
      updateStickySize: jest.fn(),
      updateStickyColor: jest.fn(),
      updateStickyFontSize: jest.fn(),
      updateStickyFormat: jest.fn(),
      deleteSticky: mockDeleteSticky,
      deleteMultiple: jest.fn(),
      restoreState: mockRestoreState,
      isLoading: false
    })
    
    render(<Board />)
    
    // Select a sticky
    const sticky = screen.getByTestId('sticky-note')
    fireEvent.click(sticky)
    
    // Enter edit mode
    fireEvent.doubleClick(sticky)
    
    // Press delete key
    fireEvent.keyDown(window, { key: 'Delete' })
    
    // Delete should not be called when editing
    expect(mockDeleteSticky).not.toHaveBeenCalled()
  })
})
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AddStickyButton from '../../app/features/sticky-notes/components/AddStickyButton'
import { useStickyStore } from '../../app/features/sticky-notes/store/useStickyStore'

// Mock the store
jest.mock('../../app/features/sticky-notes/store/useStickyStore', () => ({
  useStickyStore: jest.fn(),
}))

describe('AddStickyButton', () => {
  const mockAddSticky = jest.fn()
  const mockBoardRef = { current: { getBoundingClientRect: () => ({ left: 0, top: 0 }) } } as any

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useStickyStore as jest.Mock).mockReturnValue({
      addSticky: mockAddSticky,
    })
  })

  it('should render add button', () => {
    render(<AddStickyButton boardRef={mockBoardRef} scale={1} position={{ x: 0, y: 0 }} />)
    // Just verify component renders without errors - there will be multiple buttons (main + color picker)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })
})
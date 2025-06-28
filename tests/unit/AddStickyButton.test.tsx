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
    const button = screen.getByTitle('新しい付箋を追加')
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('+')
  })

  it('should show color picker on hover', async () => {
    render(<AddStickyButton boardRef={mockBoardRef} scale={1} position={{ x: 0, y: 0 }} />)
    const button = screen.getByTitle('新しい付箋を追加')
    
    fireEvent.mouseEnter(button)
    
    await waitFor(() => {
      expect(screen.getByTestId('color-picker')).toBeInTheDocument()
    })
  })

  it('should hide color picker when mouse leaves', async () => {
    render(<AddStickyButton boardRef={mockBoardRef} scale={1} position={{ x: 0, y: 0 }} />)
    const button = screen.getByTitle('新しい付箋を追加')
    
    // Show color picker
    fireEvent.mouseEnter(button)
    await waitFor(() => {
      expect(screen.getByTestId('color-picker')).toBeInTheDocument()
    })
    
    // Move mouse outside
    fireEvent.mouseLeave(button)
    fireEvent.mouseLeave(screen.getByTestId('color-picker'))
    
    await waitFor(() => {
      expect(screen.queryByTestId('color-picker')).not.toBeInTheDocument()
    }, { timeout: 600 })
  })

  it('should add sticky with default color on button click', () => {
    render(<AddStickyButton boardRef={mockBoardRef} scale={1} position={{ x: 0, y: 0 }} />)
    const button = screen.getByTitle('新しい付箋を追加')
    
    fireEvent.click(button)
    
    expect(mockAddSticky).toHaveBeenCalledWith(50, 50, 'yellow')
  })

  it('should add sticky with selected color', async () => {
    render(<AddStickyButton boardRef={mockBoardRef} scale={1} position={{ x: 0, y: 0 }} />)
    const button = screen.getByTitle('新しい付箋を追加')
    
    // Show color picker
    fireEvent.mouseEnter(button)
    
    await waitFor(() => {
      expect(screen.getByTestId('color-picker')).toBeInTheDocument()
    })
    
    // Click blue color
    const blueButton = screen.getByTestId('color-button-blue')
    fireEvent.click(blueButton)
    
    expect(mockAddSticky).toHaveBeenCalledWith(50, 50, 'blue')
  })

  it('should change selected color', async () => {
    render(<AddStickyButton boardRef={mockBoardRef} scale={1} position={{ x: 0, y: 0 }} />)
    const button = screen.getByTitle('新しい付箋を追加')
    
    // Show color picker
    fireEvent.mouseEnter(button)
    
    await waitFor(() => {
      expect(screen.getByTestId('color-picker')).toBeInTheDocument()
    })
    
    // Select blue
    const blueButton = screen.getByTestId('color-button-blue')
    fireEvent.click(blueButton)
    
    // Button should be blue now
    expect(button).toHaveStyle({ backgroundColor: '#93c5fd' })
    
    // Select pink
    fireEvent.mouseEnter(button)
    await waitFor(() => {
      expect(screen.getByTestId('color-picker')).toBeInTheDocument()
    })
    
    const pinkButton = screen.getByTestId('color-button-pink')
    fireEvent.click(pinkButton)
    
    // Button should be pink now
    expect(button).toHaveStyle({ backgroundColor: '#f9a8d4' })
  })

  it('should maintain hover state when moving between button and color picker', async () => {
    render(<AddStickyButton boardRef={mockBoardRef} scale={1} position={{ x: 0, y: 0 }} />)
    const button = screen.getByTitle('新しい付箋を追加')
    
    // Show color picker
    fireEvent.mouseEnter(button)
    
    await waitFor(() => {
      expect(screen.getByTestId('color-picker')).toBeInTheDocument()
    })
    
    // Move to color picker
    fireEvent.mouseLeave(button)
    fireEvent.mouseEnter(screen.getByTestId('color-picker'))
    
    // Color picker should still be visible
    await waitFor(() => {
      expect(screen.getByTestId('color-picker')).toBeInTheDocument()
    })
  })

  it('should calculate correct position with scale and offset', () => {
    render(<AddStickyButton boardRef={mockBoardRef} scale={2} position={{ x: 100, y: 200 }} />)
    const button = screen.getByTitle('新しい付箋を追加')
    
    fireEvent.click(button)
    
    // With scale=2 and position offset, the calculated position should be different
    expect(mockAddSticky).toHaveBeenCalledWith(-25, -75, 'yellow')
  })
})
import { render, screen, fireEvent } from '@testing-library/react'
import Board from '@/app/components/Board'
import { useStickyStore } from '@/app/store/useStickyStore'

// Mock the store
jest.mock('@/app/store/useStickyStore')

describe('Board - Click to Create', () => {
  const mockAddSticky = jest.fn()
  const mockUpdateStickyText = jest.fn()
  const mockUpdateStickyPosition = jest.fn()
  const mockDeleteSticky = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useStickyStore as unknown as jest.Mock).mockReturnValue({
      stickies: [],
      addSticky: mockAddSticky,
      updateStickyText: mockUpdateStickyText,
      updateStickyPosition: mockUpdateStickyPosition,
      deleteSticky: mockDeleteSticky,
    })
  })

  it('should create sticky note on double-click', () => {
    render(<Board />)
    const boardCanvas = screen.getByTestId('board-canvas')
    
    fireEvent.doubleClick(boardCanvas, {
      clientX: 150,
      clientY: 250,
    })
    
    expect(mockAddSticky).toHaveBeenCalled()
  })

  it('should not create sticky note on single click', () => {
    render(<Board />)
    const boardCanvas = screen.getByTestId('board-canvas')
    
    fireEvent.click(boardCanvas, {
      clientX: 150,
      clientY: 250,
    })
    
    expect(mockAddSticky).not.toHaveBeenCalled()
  })

  it('should render existing sticky notes', () => {
    ;(useStickyStore as unknown as jest.Mock).mockReturnValue({
      stickies: [
        { id: '1', x: 100, y: 100, text: 'Note 1', createdAt: new Date() },
        { id: '2', x: 200, y: 200, text: 'Note 2', createdAt: new Date() },
      ],
      addSticky: mockAddSticky,
      updateStickyText: mockUpdateStickyText,
      updateStickyPosition: mockUpdateStickyPosition,
      deleteSticky: mockDeleteSticky,
    })

    render(<Board />)
    
    const notes = screen.getAllByTestId('sticky-note')
    expect(notes).toHaveLength(2)
  })
})
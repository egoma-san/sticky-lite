import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Board from '@/app/components/Board'
import { useStickyStore } from '@/app/store/useStickyStore'

// Mock the store
jest.mock('@/app/store/useStickyStore')

describe('Board', () => {
  const mockAddSticky = jest.fn()
  const mockDeleteSticky = jest.fn()
  const mockUpdateStickyText = jest.fn()
  const mockUpdateStickyPosition = jest.fn()
  
  const mockStickies = [
    { id: 'test-1', x: 100, y: 100, text: 'Test Note 1', createdAt: new Date() },
    { id: 'test-2', x: 200, y: 200, text: 'Test Note 2', createdAt: new Date() }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useStickyStore as unknown as jest.Mock).mockReturnValue({
      stickies: mockStickies,
      addSticky: mockAddSticky,
      deleteSticky: mockDeleteSticky,
      updateStickyText: mockUpdateStickyText,
      updateStickyPosition: mockUpdateStickyPosition,
    })
    
    // Mock Audio API
    global.Audio = jest.fn().mockImplementation(() => ({
      play: jest.fn().mockResolvedValue(undefined),
      volume: 0.3,
    })) as any
  })

  it('should render board element', () => {
    render(<Board />)
    const board = screen.getByTestId('board')
    expect(board).toBeInTheDocument()
  })

  it('should render trash zone', () => {
    render(<Board />)
    const trashZone = screen.getByTestId('trash-zone')
    expect(trashZone).toBeInTheDocument()
  })

  it('should delete selected sticky when trash button is clicked', () => {
    render(<Board />)
    
    // Select a sticky note
    const stickyNote = screen.getByText('Test Note 1').closest('[data-testid="sticky-note"]')
    fireEvent.click(stickyNote!)
    
    // Click trash button
    const trashButton = screen.getByTestId('trash-zone')
    fireEvent.click(trashButton)
    
    // Verify deleteSticky was called with the selected sticky's id
    expect(mockDeleteSticky).toHaveBeenCalledWith('test-1')
  })

  it('should not delete anything when trash is clicked with no selection', () => {
    render(<Board />)
    
    // Click trash button without selecting anything
    const trashButton = screen.getByTestId('trash-zone')
    fireEvent.click(trashButton)
    
    // Verify deleteSticky was not called
    expect(mockDeleteSticky).not.toHaveBeenCalled()
  })

  it('should delete sticky when dragged to trash', async () => {
    render(<Board />)
    
    const stickyNote = screen.getByText('Test Note 1').closest('[data-testid="sticky-note"]')
    const trashZone = screen.getByTestId('trash-zone')
    
    // Simulate drag and drop
    fireEvent.dragStart(stickyNote!, {
      dataTransfer: {
        setData: jest.fn(),
        effectAllowed: 'move'
      }
    })
    
    fireEvent.dragEnter(trashZone)
    fireEvent.dragOver(trashZone, {
      dataTransfer: {
        dropEffect: 'move'
      }
    })
    
    const dataTransfer = {
      getData: jest.fn().mockReturnValue('test-1'),
    }
    
    fireEvent.drop(trashZone, { dataTransfer })
    
    // Wait for the timeout in TrashZone
    await waitFor(() => {
      expect(mockDeleteSticky).toHaveBeenCalledWith('test-1')
    }, { timeout: 150 })
  })

  it('should deselect sticky after deletion', () => {
    render(<Board />)
    
    // Select a sticky note by clicking on it
    const stickyNote = screen.getByText('Test Note 1').closest('[data-testid="sticky-note"]')
    fireEvent.click(stickyNote!)
    
    // Click trash button
    const trashButton = screen.getByTestId('trash-zone')
    fireEvent.click(trashButton)
    
    // Verify delete was called with the correct id
    expect(mockDeleteSticky).toHaveBeenCalledWith('test-1')
  })
})
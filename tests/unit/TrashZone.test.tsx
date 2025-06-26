import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TrashZone } from '@/app/features/sticky-notes'

describe('TrashZone', () => {
  const mockOnDrop = jest.fn()
  const mockOnDeleteSelected = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock Audio API
    global.Audio = jest.fn().mockImplementation(() => ({
      play: jest.fn().mockResolvedValue(undefined),
      volume: 0.3,
    })) as any
  })

  it('should render trash zone', () => {
    render(<TrashZone onDrop={mockOnDrop} />)
    const trashZone = screen.getByTestId('trash-zone')
    expect(trashZone).toBeInTheDocument()
  })

  it('should render as a button element', () => {
    render(<TrashZone onDrop={mockOnDrop} />)
    const trashZone = screen.getByTestId('trash-zone')
    expect(trashZone.tagName).toBe('BUTTON')
  })

  it('should call onDeleteSelected when clicked', () => {
    render(<TrashZone onDrop={mockOnDrop} onDeleteSelected={mockOnDeleteSelected} />)
    const trashZone = screen.getByTestId('trash-zone')
    
    fireEvent.click(trashZone)
    
    expect(mockOnDeleteSelected).toHaveBeenCalledTimes(1)
  })

  it('should not throw error when clicked without onDeleteSelected', () => {
    render(<TrashZone onDrop={mockOnDrop} />)
    const trashZone = screen.getByTestId('trash-zone')
    
    expect(() => fireEvent.click(trashZone)).not.toThrow()
  })

  it('should change appearance on drag over', () => {
    render(<TrashZone onDrop={mockOnDrop} />)
    const trashZone = screen.getByTestId('trash-zone')
    
    // Check initial state
    expect(trashZone).toHaveStyle({
      background: expect.stringContaining('rgba(255, 255, 255')
    })
    
    // Drag enter
    fireEvent.dragEnter(trashZone)
    expect(trashZone).toHaveStyle({
      background: expect.stringContaining('rgba(255, 69, 58')
    })
    
    // Drag leave
    fireEvent.dragLeave(trashZone)
    expect(trashZone).toHaveStyle({
      background: expect.stringContaining('rgba(255, 255, 255')
    })
  })

  it('should call onDrop when item is dropped', async () => {
    render(<TrashZone onDrop={mockOnDrop} />)
    const trashZone = screen.getByTestId('trash-zone')
    
    const mockDataTransfer = {
      getData: jest.fn().mockReturnValue('test-sticky-id'),
    }
    
    fireEvent.drop(trashZone, {
      dataTransfer: mockDataTransfer,
    })
    
    // Wait for the setTimeout in handleDrop
    await waitFor(() => {
      expect(mockOnDrop).toHaveBeenCalledWith('test-sticky-id')
    }, { timeout: 150 })
  })

  it('should play sound when item is dropped', () => {
    render(<TrashZone onDrop={mockOnDrop} />)
    const trashZone = screen.getByTestId('trash-zone')
    
    const mockDataTransfer = {
      getData: jest.fn().mockReturnValue('test-sticky-id'),
    }
    
    fireEvent.drop(trashZone, {
      dataTransfer: mockDataTransfer,
    })
    
    expect(global.Audio).toHaveBeenCalled()
  })

  it('should not call onDrop when dropped without stickyId', () => {
    render(<TrashZone onDrop={mockOnDrop} />)
    const trashZone = screen.getByTestId('trash-zone')
    
    const mockDataTransfer = {
      getData: jest.fn().mockReturnValue(''),
    }
    
    fireEvent.drop(trashZone, {
      dataTransfer: mockDataTransfer,
    })
    
    expect(mockOnDrop).not.toHaveBeenCalled()
  })
})
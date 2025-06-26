import { render, screen, fireEvent } from '@testing-library/react'
import { StickyNote } from '@/app/features/sticky-notes'

describe('StickyNote', () => {
  const mockOnTextChange = jest.fn()
  const mockOnPositionChange = jest.fn()
  const mockOnDelete = jest.fn()
  const mockOnSelect = jest.fn()

  // Mock Audio API for tests
  beforeAll(() => {
    global.Audio = jest.fn().mockImplementation(() => ({
      play: jest.fn().mockResolvedValue(undefined),
      volume: 0.3,
    })) as any
  })

  const defaultProps = {
    id: 'test-id',
    x: 100,
    y: 200,
    text: 'Test note',
    isSelected: false,
    onSelect: mockOnSelect,
    onTextChange: mockOnTextChange,
    onPositionChange: mockOnPositionChange,
    onDelete: mockOnDelete,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render sticky note with text', () => {
    render(<StickyNote {...defaultProps} />)
    const textarea = screen.getByDisplayValue('Test note')
    expect(textarea).toBeInTheDocument()
  })

  it('should have correct position styles', () => {
    render(<StickyNote {...defaultProps} />)
    const stickyNote = screen.getByTestId('sticky-note')
    expect(stickyNote).toHaveStyle({
      left: '100px',
      top: '200px',
    })
  })

  it('should call onTextChange when text is edited', () => {
    render(<StickyNote {...defaultProps} />)
    const textarea = screen.getByDisplayValue('Test note')
    
    fireEvent.change(textarea, { target: { value: 'Updated note' } })
    
    expect(mockOnTextChange).toHaveBeenCalledWith('test-id', 'Updated note')
  })

  it('should be draggable', () => {
    render(<StickyNote {...defaultProps} />)
    const stickyNote = screen.getByTestId('sticky-note')
    
    expect(stickyNote).toHaveAttribute('draggable', 'true')
  })

  it('should not delete when pressing delete/backspace while typing in textarea', () => {
    render(<StickyNote {...defaultProps} isSelected={true} />)
    const textarea = screen.getByDisplayValue('Test note')
    
    // Focus the textarea
    fireEvent.focus(textarea)
    
    // Press delete key while textarea is focused
    fireEvent.keyDown(window, { key: 'Delete' })
    
    // Should not call onDelete
    expect(mockOnDelete).not.toHaveBeenCalled()
    
    // Press backspace key while textarea is focused
    fireEvent.keyDown(window, { key: 'Backspace' })
    
    // Still should not call onDelete
    expect(mockOnDelete).not.toHaveBeenCalled()
  })

  it('should delete when pressing delete/backspace while not typing', async () => {
    render(<StickyNote {...defaultProps} isSelected={true} />)
    
    // Press delete key when textarea is not focused
    fireEvent.keyDown(window, { key: 'Delete' })
    
    // Wait for the crumple animation
    await new Promise(resolve => setTimeout(resolve, 350))
    
    expect(mockOnDelete).toHaveBeenCalledWith('test-id')
  })
})
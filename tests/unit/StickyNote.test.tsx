import { render, screen, fireEvent } from '@testing-library/react'
import StickyNote from '@/app/(sticky)/components/StickyNote'

describe('StickyNote', () => {
  const mockOnTextChange = jest.fn()
  const mockOnPositionChange = jest.fn()
  const mockOnDelete = jest.fn()
  const mockOnSelect = jest.fn()

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
})
import { render, screen, fireEvent } from '@testing-library/react'
import { StickyNote } from '@/app/features/sticky-notes'

describe('StickyNote', () => {
  const mockOnTextChange = jest.fn()
  const mockOnPositionChange = jest.fn()
  const mockOnDelete = jest.fn()
  const mockOnSelect = jest.fn()
  const mockOnSizeChange = jest.fn()
  const mockOnFontSizeChange = jest.fn()
  const mockOnFormatChange = jest.fn()

  // Mock Audio API for tests
  beforeAll(() => {
    global.Audio = jest.fn().mockImplementation(() => ({
      play: jest.fn().mockResolvedValue(undefined),
      volume: 0.3,
    })) as any
  })

  const defaultProps = {
    id: '1',
    x: 100,
    y: 200,
    text: 'Test note',
    color: 'yellow' as const,
    isSelected: false,
    onSelect: mockOnSelect,
    onTextChange: mockOnTextChange,
    onPositionChange: mockOnPositionChange,
    onSizeChange: mockOnSizeChange,
    onFontSizeChange: mockOnFontSizeChange,
    onFormatChange: mockOnFormatChange,
    onDelete: mockOnDelete,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render sticky note with text', () => {
    render(<StickyNote {...defaultProps} />)
    expect(screen.getByText('Test note')).toBeInTheDocument()
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
    
    const note = screen.getByTestId('sticky-note')
    fireEvent.doubleClick(note)
    
    // Find the contentEditable div after entering edit mode
    const editor = note.querySelector('[contenteditable="true"]')
    expect(editor).toBeInTheDocument()
    
    // Simulate text input in the editor
    if (editor) {
      fireEvent.input(editor, { target: { textContent: 'Updated note' } })
    }
    
    expect(mockOnTextChange).toHaveBeenCalledWith('1', 'Updated note', expect.any(String))
  })

  it('should be draggable', () => {
    render(<StickyNote {...defaultProps} />)
    const stickyNote = screen.getByTestId('sticky-note')
    
    expect(stickyNote).toHaveAttribute('draggable', 'true')
  })

  it('should delete when pressing delete/backspace while not typing', async () => {
    render(<StickyNote {...defaultProps} isSelected={true} />)
    
    // Press delete key when textarea is not focused
    fireEvent.keyDown(window, { key: 'Delete' })
    
    // Wait for the crumple animation
    await new Promise(resolve => setTimeout(resolve, 350))
    
    expect(mockOnDelete).toHaveBeenCalledWith('1')
  })

  it('should enter edit mode on double click', () => {
    render(<StickyNote {...defaultProps} />)
    
    const note = screen.getByTestId('sticky-note')
    fireEvent.doubleClick(note)
    
    // Check if contentEditable div exists (rich text editor)
    const editor = note.querySelector('[contenteditable="true"]')
    expect(editor).toBeInTheDocument()
  })

  it('should exit edit mode on ESC key', () => {
    render(<StickyNote {...defaultProps} />)
    
    const note = screen.getByTestId('sticky-note')
    fireEvent.doubleClick(note)
    
    // Check if contentEditable div exists
    const editor = note.querySelector('[contenteditable="true"]')
    expect(editor).toBeInTheDocument()
    
    // Press ESC
    if (editor) {
      fireEvent.keyDown(editor, { key: 'Escape', preventDefault: jest.fn() })
    }
    
    // Editor should not be present after ESC
    const editorAfter = note.querySelector('[contenteditable="true"]')
    expect(editorAfter).not.toBeInTheDocument()
  })

  it('should show resize handles when selected', () => {
    render(<StickyNote {...defaultProps} isSelected={true} />)
    
    expect(screen.getByTestId('resize-handle-tl')).toBeInTheDocument()
    expect(screen.getByTestId('resize-handle-tr')).toBeInTheDocument()
    expect(screen.getByTestId('resize-handle-bl')).toBeInTheDocument()
    expect(screen.getByTestId('resize-handle-br')).toBeInTheDocument()
  })

  it('should not show resize handles when not selected', () => {
    render(<StickyNote {...defaultProps} isSelected={false} />)
    
    expect(screen.queryByTestId('resize-handle-tl')).not.toBeInTheDocument()
    expect(screen.queryByTestId('resize-handle-tr')).not.toBeInTheDocument()
    expect(screen.queryByTestId('resize-handle-bl')).not.toBeInTheDocument()
    expect(screen.queryByTestId('resize-handle-br')).not.toBeInTheDocument()
  })

  it('should not show resize handles when part of multiple selection', () => {
    render(<StickyNote {...defaultProps} isSelected={true} hasMultipleSelection={true} />)
    
    expect(screen.queryByTestId('resize-handle-tl')).not.toBeInTheDocument()
    expect(screen.queryByTestId('resize-handle-tr')).not.toBeInTheDocument()
    expect(screen.queryByTestId('resize-handle-bl')).not.toBeInTheDocument()
    expect(screen.queryByTestId('resize-handle-br')).not.toBeInTheDocument()
  })

  it('should handle resize with mouse drag', () => {
    render(<StickyNote {...defaultProps} isSelected={true} />)
    
    const resizeHandle = screen.getByTestId('resize-handle-br')
    
    // Start resize
    fireEvent.mouseDown(resizeHandle, { clientX: 0, clientY: 0 })
    
    // Drag
    fireEvent.mouseMove(document, { clientX: 100, clientY: 100 })
    
    // Release
    fireEvent.mouseUp(document)
    
    expect(mockOnSizeChange).toHaveBeenCalled()
    expect(mockOnPositionChange).toHaveBeenCalled()
  })

  it('should render with custom size', () => {
    render(<StickyNote {...defaultProps} size={2} />)
    
    const note = screen.getByTestId('sticky-note')
    expect(note).toHaveStyle({ width: '384px', height: '384px' })
  })

  it('should render with custom font size', () => {
    render(<StickyNote {...defaultProps} fontSize={24} />)
    
    const note = screen.getByTestId('sticky-note')
    const textDiv = note.querySelector('div[style*="font-size: 24px"]')
    expect(textDiv).toBeInTheDocument()
  })

  it('should render with bold text', () => {
    render(<StickyNote {...defaultProps} isBold={true} text="Bold text" />)
    
    const note = screen.getByTestId('sticky-note')
    // Text should be visible even without double-clicking in display mode
    const textContent = note.textContent
    expect(textContent).toContain('Bold text')
  })

  it('should render with italic text', () => {
    render(<StickyNote {...defaultProps} isItalic={true} text="Italic text" />)
    
    const note = screen.getByTestId('sticky-note')
    // Text should be visible even without double-clicking in display mode
    const textContent = note.textContent
    expect(textContent).toContain('Italic text')
  })

  it('should render with underline text', () => {
    render(<StickyNote {...defaultProps} isUnderline={true} text="Underline text" />)
    
    const note = screen.getByTestId('sticky-note')
    // Text should be visible even without double-clicking in display mode
    const textContent = note.textContent
    expect(textContent).toContain('Underline text')
  })

  it('should handle font size increase shortcut', () => {
    render(<StickyNote {...defaultProps} isSelected={true} />)
    
    fireEvent.keyDown(window, { key: '>', shiftKey: true, ctrlKey: true })
    
    expect(mockOnFontSizeChange).toHaveBeenCalledWith('1', 18)
  })

  it('should handle font size decrease shortcut', () => {
    render(<StickyNote {...defaultProps} isSelected={true} fontSize={20} />)
    
    fireEvent.keyDown(window, { key: '<', shiftKey: true, ctrlKey: true })
    
    expect(mockOnFontSizeChange).toHaveBeenCalledWith('1', 18)
  })

  it('should handle alternative font size increase shortcut', () => {
    render(<StickyNote {...defaultProps} isSelected={true} />)
    
    fireEvent.keyDown(window, { key: '+', ctrlKey: true })
    
    expect(mockOnFontSizeChange).toHaveBeenCalledWith('1', 18)
  })

  it('should handle alternative font size decrease shortcut', () => {
    render(<StickyNote {...defaultProps} isSelected={true} fontSize={20} />)
    
    fireEvent.keyDown(window, { key: '-', ctrlKey: true })
    
    expect(mockOnFontSizeChange).toHaveBeenCalledWith('1', 18)
  })

  it.skip('should handle bold toggle shortcut', () => {
    // Skipped: Bold formatting is now handled by RichTextEditor
    render(<StickyNote {...defaultProps} isSelected={true} />)
    
    fireEvent.keyDown(window, { key: 'b', ctrlKey: true })
    
    expect(mockOnFormatChange).toHaveBeenCalledWith('1', { isBold: true })
  })

  it.skip('should handle italic toggle shortcut', () => {
    // Skipped: Italic formatting is now handled by RichTextEditor
    render(<StickyNote {...defaultProps} isSelected={true} />)
    
    fireEvent.keyDown(window, { key: 'i', ctrlKey: true })
    
    expect(mockOnFormatChange).toHaveBeenCalledWith('1', { isItalic: true })
  })

  it.skip('should handle underline toggle shortcut', () => {
    // Skipped: Underline formatting is now handled by RichTextEditor
    render(<StickyNote {...defaultProps} isSelected={true} />)
    
    fireEvent.keyDown(window, { key: 'u', ctrlKey: true })
    
    expect(mockOnFormatChange).toHaveBeenCalledWith('1', { isUnderline: true })
  })

  it('should render different colors correctly', () => {
    const { rerender } = render(<StickyNote {...defaultProps} color="yellow" />)
    let note = screen.getByTestId('sticky-note').querySelector('.bg-yellow-300')
    expect(note).toBeInTheDocument()
    
    rerender(<StickyNote {...defaultProps} color="blue" />)
    note = screen.getByTestId('sticky-note').querySelector('.bg-blue-300')
    expect(note).toBeInTheDocument()
    
    rerender(<StickyNote {...defaultProps} color="pink" />)
    note = screen.getByTestId('sticky-note').querySelector('.bg-pink-300')
    expect(note).toBeInTheDocument()
  })

  it('should handle drag start correctly', () => {
    render(<StickyNote {...defaultProps} />)
    
    const note = screen.getByTestId('sticky-note')
    const setData = jest.fn()
    
    fireEvent.dragStart(note, {
      dataTransfer: {
        setData,
        effectAllowed: 'move'
      }
    })
    
    expect(setData).toHaveBeenCalledWith('stickyId', '1')
  })

  it('should select note on click', () => {
    render(<StickyNote {...defaultProps} />)
    
    const note = screen.getByTestId('sticky-note')
    fireEvent.click(note)
    
    expect(mockOnSelect).toHaveBeenCalled()
  })

  it('should exit edit mode when clicking outside', () => {
    render(
      <div>
        <StickyNote {...defaultProps} />
        <div data-testid="outside">Outside</div>
      </div>
    )
    
    const note = screen.getByTestId('sticky-note')
    fireEvent.doubleClick(note)
    
    // Check if contentEditable div exists (rich text editor)
    const editor = note.querySelector('[contenteditable="true"]')
    expect(editor).toBeInTheDocument()
    
    // Click outside and blur the editor
    const outside = screen.getByTestId('outside')
    fireEvent.mouseDown(outside)
    if (editor) {
      fireEvent.blur(editor)
    }
    
    // Editor should not be present after clicking outside
    const editorAfter = note.querySelector('[contenteditable="true"]')
    expect(editorAfter).not.toBeInTheDocument()
  })

  it('should exit edit mode when selection is lost', () => {
    const { rerender } = render(<StickyNote {...defaultProps} isSelected={true} />)
    
    const note = screen.getByTestId('sticky-note')
    fireEvent.doubleClick(note)
    
    // Check if contentEditable div exists (rich text editor)
    const editor = note.querySelector('[contenteditable="true"]')
    expect(editor).toBeInTheDocument()
    
    // Lose selection
    rerender(<StickyNote {...defaultProps} isSelected={false} />)
    
    // Editor should not be present when not in edit mode
    const editorAfter = note.querySelector('[contenteditable="true"]')
    expect(editorAfter).not.toBeInTheDocument()
  })
})
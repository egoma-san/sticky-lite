import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import RichTextEditor from '../../app/features/sticky-notes/components/RichTextEditor'

describe('RichTextEditor', () => {
  const mockOnChange = jest.fn()
  const mockOnBlur = jest.fn()

  const defaultProps = {
    value: 'Test content',
    onChange: mockOnChange,
    onBlur: mockOnBlur,
    fontSize: 16,
    autoFocus: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock document.execCommand
    document.execCommand = jest.fn(() => true)
  })

  it('should render contenteditable div', () => {
    const { container } = render(<RichTextEditor {...defaultProps} />)
    
    const editor = container.querySelector('[contenteditable="true"]')
    expect(editor).toBeInTheDocument()
  })

  it('should apply custom font size', () => {
    const { container } = render(<RichTextEditor {...defaultProps} fontSize={24} />)
    
    const editor = container.querySelector('[contenteditable="true"]')
    expect(editor).toHaveStyle({ fontSize: '24px' })
  })

  it('should apply custom className', () => {
    const { container } = render(<RichTextEditor {...defaultProps} className="custom-class" />)
    
    const editor = container.querySelector('[contenteditable="true"]')
    expect(editor).toHaveClass('custom-class')
  })

  it('should handle text input', async () => {
    const { container } = render(<RichTextEditor {...defaultProps} value="" />)
    
    const editor = container.querySelector('[contenteditable="true"]') as HTMLElement
    
    // Simulate typing
    fireEvent.input(editor, { 
      target: { 
        textContent: 'New text',
        innerHTML: 'New text'
      } 
    })

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('New text', 'New text')
    })
  })

  it('should handle blur event', () => {
    const { container } = render(<RichTextEditor {...defaultProps} />)
    
    const editor = container.querySelector('[contenteditable="true"]') as HTMLElement
    fireEvent.blur(editor)

    expect(mockOnBlur).toHaveBeenCalled()
  })

  it('should handle bold formatting', () => {
    const { container } = render(<RichTextEditor {...defaultProps} />)
    
    const editor = container.querySelector('[contenteditable="true"]') as HTMLElement
    
    // Focus the editor
    fireEvent.focus(editor)
    
    // Simulate Ctrl+B
    const preventDefaultMock = jest.fn()
    fireEvent.keyDown(editor, { 
      key: 'b', 
      ctrlKey: true,
      preventDefault: preventDefaultMock
    })
    
    expect(preventDefaultMock).toHaveBeenCalled()
    expect(document.execCommand).toHaveBeenCalledWith('bold', false)
  })

  it('should handle italic formatting', () => {
    const { container } = render(<RichTextEditor {...defaultProps} />)
    
    const editor = container.querySelector('[contenteditable="true"]') as HTMLElement
    
    // Focus the editor
    fireEvent.focus(editor)
    
    // Simulate Ctrl+I
    const preventDefaultMock = jest.fn()
    fireEvent.keyDown(editor, { 
      key: 'i', 
      ctrlKey: true,
      preventDefault: preventDefaultMock
    })
    
    expect(preventDefaultMock).toHaveBeenCalled()
    expect(document.execCommand).toHaveBeenCalledWith('italic', false)
  })

  it('should handle underline formatting', () => {
    const { container } = render(<RichTextEditor {...defaultProps} />)
    
    const editor = container.querySelector('[contenteditable="true"]') as HTMLElement
    
    // Focus the editor
    fireEvent.focus(editor)
    
    // Simulate Ctrl+U
    const preventDefaultMock = jest.fn()
    fireEvent.keyDown(editor, { 
      key: 'u', 
      ctrlKey: true,
      preventDefault: preventDefaultMock
    })
    
    expect(preventDefaultMock).toHaveBeenCalled()
    expect(document.execCommand).toHaveBeenCalledWith('underline', false)
  })

  it('should focus on mount when autoFocus is true', () => {
    const { container } = render(<RichTextEditor {...defaultProps} autoFocus={true} />)
    
    const editor = container.querySelector('[contenteditable="true"]')
    expect(document.activeElement).toBe(editor)
  })

  it('should handle empty value', () => {
    const { container } = render(<RichTextEditor {...defaultProps} value="" richText={undefined} />)
    
    const editor = container.querySelector('[contenteditable="true"]')
    expect(editor?.textContent).toBe('')
  })
})
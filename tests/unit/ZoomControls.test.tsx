import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ZoomControls from '../../app/features/sticky-notes/components/ZoomControls'

describe('ZoomControls', () => {
  const mockOnScaleChange = jest.fn()
  const defaultProps = {
    scale: 1,
    minScale: 0.1,
    maxScale: 2,
    onScaleChange: mockOnScaleChange,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render zoom controls', () => {
    render(<ZoomControls {...defaultProps} />)
    
    expect(screen.getByText('−')).toBeInTheDocument()
    expect(screen.getByText('+')).toBeInTheDocument()
    expect(screen.getByDisplayValue('100%')).toBeInTheDocument()
  })

  it('should zoom out when minus button is clicked', () => {
    render(<ZoomControls {...defaultProps} />)
    
    const minusButton = screen.getByText('−')
    fireEvent.click(minusButton)
    
    expect(mockOnScaleChange).toHaveBeenCalledWith(0.9)
  })

  it('should zoom in when plus button is clicked', () => {
    render(<ZoomControls {...defaultProps} />)
    
    const plusButton = screen.getByText('+')
    fireEvent.click(plusButton)
    
    expect(mockOnScaleChange).toHaveBeenCalledWith(1.1)
  })

  it('should disable minus button at min scale', () => {
    render(<ZoomControls {...defaultProps} scale={0.1} />)
    
    const minusButton = screen.getByText('−')
    expect(minusButton).toBeDisabled()
  })

  it('should disable plus button at max scale', () => {
    render(<ZoomControls {...defaultProps} scale={2} />)
    
    const plusButton = screen.getByText('+')
    expect(plusButton).toBeDisabled()
  })

  it('should display correct percentage', () => {
    render(<ZoomControls {...defaultProps} scale={1.5} />)
    
    expect(screen.getByDisplayValue('150%')).toBeInTheDocument()
  })

  it('should handle manual percentage input', async () => {
    const user = userEvent.setup()
    render(<ZoomControls {...defaultProps} />)
    
    const input = screen.getByDisplayValue('100%')
    
    // Clear and type new value
    await user.clear(input)
    await user.type(input, '150')
    
    // Input should show the typed value
    expect(input).toHaveValue('150')
  })

  it('should apply scale on Enter key', async () => {
    const user = userEvent.setup()
    render(<ZoomControls {...defaultProps} />)
    
    const input = screen.getByDisplayValue('100%')
    
    await user.clear(input)
    await user.type(input, '150')
    await user.keyboard('{Enter}')
    
    expect(mockOnScaleChange).toHaveBeenCalledWith(1.5)
  })

  it('should apply scale on blur', async () => {
    const user = userEvent.setup()
    render(<ZoomControls {...defaultProps} />)
    
    const input = screen.getByDisplayValue('100%')
    
    await user.clear(input)
    await user.type(input, '75')
    fireEvent.blur(input)
    
    expect(mockOnScaleChange).toHaveBeenCalledWith(0.75)
  })

  it('should clamp value to min scale', async () => {
    const user = userEvent.setup()
    render(<ZoomControls {...defaultProps} />)
    
    const input = screen.getByDisplayValue('100%')
    
    await user.clear(input)
    await user.type(input, '5')
    fireEvent.blur(input)
    
    expect(mockOnScaleChange).toHaveBeenCalledWith(0.1)
  })

  it('should clamp value to max scale', async () => {
    const user = userEvent.setup()
    render(<ZoomControls {...defaultProps} />)
    
    const input = screen.getByDisplayValue('100%')
    
    await user.clear(input)
    await user.type(input, '300')
    fireEvent.blur(input)
    
    expect(mockOnScaleChange).toHaveBeenCalledWith(2)
  })

  it('should handle invalid input', async () => {
    const user = userEvent.setup()
    render(<ZoomControls {...defaultProps} />)
    
    const input = screen.getByDisplayValue('100%')
    
    await user.clear(input)
    await user.type(input, 'abc')
    fireEvent.blur(input)
    
    // Should not call onScaleChange with invalid input
    expect(mockOnScaleChange).not.toHaveBeenCalled()
    // Should reset to current scale
    expect(input).toHaveValue('100%')
  })

  it('should handle empty input', async () => {
    const user = userEvent.setup()
    render(<ZoomControls {...defaultProps} />)
    
    const input = screen.getByDisplayValue('100%')
    
    await user.clear(input)
    fireEvent.blur(input)
    
    // Should not call onScaleChange with empty input
    expect(mockOnScaleChange).not.toHaveBeenCalled()
    // Should reset to current scale
    expect(input).toHaveValue('100%')
  })

  it('should update display when scale prop changes', () => {
    const { rerender } = render(<ZoomControls {...defaultProps} />)
    
    expect(screen.getByDisplayValue('100%')).toBeInTheDocument()
    
    rerender(<ZoomControls {...defaultProps} scale={1.75} />)
    
    expect(screen.getByDisplayValue('175%')).toBeInTheDocument()
  })

  it('should not trigger change if new scale equals current scale', async () => {
    const user = userEvent.setup()
    render(<ZoomControls {...defaultProps} />)
    
    const input = screen.getByDisplayValue('100%')
    
    await user.clear(input)
    await user.type(input, '100')
    fireEvent.blur(input)
    
    expect(mockOnScaleChange).not.toHaveBeenCalled()
  })

  it('should handle percentage symbol in input', async () => {
    const user = userEvent.setup()
    render(<ZoomControls {...defaultProps} />)
    
    const input = screen.getByDisplayValue('100%')
    
    await user.clear(input)
    await user.type(input, '150%')
    fireEvent.blur(input)
    
    expect(mockOnScaleChange).toHaveBeenCalledWith(1.5)
  })

  it('should handle focus on input', () => {
    render(<ZoomControls {...defaultProps} />)
    
    const input = screen.getByDisplayValue('100%')
    fireEvent.focus(input)
    
    // Input should be focused
    expect(document.activeElement).toBe(input)
  })

  it('should handle different scale values', () => {
    const { rerender } = render(<ZoomControls {...defaultProps} scale={0.5} />)
    expect(screen.getByDisplayValue('50%')).toBeInTheDocument()
    
    rerender(<ZoomControls {...defaultProps} scale={0.75} />)
    expect(screen.getByDisplayValue('75%')).toBeInTheDocument()
    
    rerender(<ZoomControls {...defaultProps} scale={1.25} />)
    expect(screen.getByDisplayValue('125%')).toBeInTheDocument()
    
    rerender(<ZoomControls {...defaultProps} scale={2} />)
    expect(screen.getByDisplayValue('200%')).toBeInTheDocument()
  })

  it('should handle decimal input values', async () => {
    const user = userEvent.setup()
    render(<ZoomControls {...defaultProps} />)
    
    const input = screen.getByDisplayValue('100%')
    
    await user.clear(input)
    await user.type(input, '87.5')
    fireEvent.blur(input)
    
    expect(mockOnScaleChange).toHaveBeenCalledWith(0.875)
  })

  it('should round percentage display', () => {
    render(<ZoomControls {...defaultProps} scale={1.234} />)
    expect(screen.getByDisplayValue('123%')).toBeInTheDocument()
  })

  it('should allow typing while editing', async () => {
    const user = userEvent.setup()
    render(<ZoomControls {...defaultProps} />)
    
    const input = screen.getByDisplayValue('100%')
    
    await user.clear(input)
    await user.type(input, '1')
    expect(input).toHaveValue('1')
    
    await user.type(input, '2')
    expect(input).toHaveValue('12')
    
    await user.type(input, '5')
    expect(input).toHaveValue('125')
  })

  it('should not apply change on escape key', async () => {
    const user = userEvent.setup()
    render(<ZoomControls {...defaultProps} />)
    
    const input = screen.getByDisplayValue('100%')
    
    await user.clear(input)
    await user.type(input, '150')
    await user.keyboard('{Escape}')
    
    // Should reset to original value
    expect(input).toHaveValue('100%')
    expect(mockOnScaleChange).not.toHaveBeenCalled()
  })
})
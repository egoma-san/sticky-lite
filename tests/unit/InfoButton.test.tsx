import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import InfoButton from '../../app/features/sticky-notes/components/InfoButton'

describe('InfoButton', () => {
  it('should render info button', () => {
    render(<InfoButton />)
    const button = screen.getByTitle('ショートカット一覧')
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('i')
  })

  it('should show modal when clicked', () => {
    render(<InfoButton />)
    const button = screen.getByTitle('ショートカット一覧')
    
    fireEvent.click(button)
    
    expect(screen.getByText('キーボードショートカット')).toBeInTheDocument()
    expect(screen.getByText('付箋の操作')).toBeInTheDocument()
    expect(screen.getByText('テキストフォーマット')).toBeInTheDocument()
  })

  it('should close modal when clicking outside', () => {
    render(<InfoButton />)
    const button = screen.getByTitle('ショートカット一覧')
    
    fireEvent.click(button)
    expect(screen.getByText('キーボードショートカット')).toBeInTheDocument()
    
    const overlay = screen.getByText('キーボードショートカット').closest('.fixed')
    fireEvent.click(overlay!)
    
    expect(screen.queryByText('キーボードショートカット')).not.toBeInTheDocument()
  })

  it('should close modal when clicking close button', () => {
    render(<InfoButton />)
    const button = screen.getByTitle('ショートカット一覧')
    
    fireEvent.click(button)
    
    const closeButton = screen.getByRole('button', { name: '' }).parentElement!.querySelector('button:last-child')
    fireEvent.click(closeButton!)
    
    expect(screen.queryByText('キーボードショートカット')).not.toBeInTheDocument()
  })
})
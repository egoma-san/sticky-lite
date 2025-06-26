'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'

interface StickyNoteProps {
  id: string
  x: number
  y: number
  text: string
  isSelected: boolean
  onSelect: () => void
  onTextChange: (id: string, text: string) => void
  onPositionChange: (id: string, x: number, y: number) => void
  onDelete: (id: string) => void
}

export default function StickyNote({
  id,
  x,
  y,
  text,
  isSelected,
  onSelect,
  onTextChange,
  onPositionChange,
  onDelete,
}: StickyNoteProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isCrumpling, setIsCrumpling] = useState(false)
  const noteRef = useRef<HTMLDivElement>(null)

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)
    const rect = noteRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('stickyId', id)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false)
    // Position will be updated by Board component on drop
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect()
  }

  const handleDelete = useCallback(() => {
    // Play crumple sound
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYmLjo+UmJmbnp+ipqirrrCztLW5vr7Awc')
    audio.volume = 0.3
    audio.play().catch(() => {}) // Ignore errors if audio fails
    
    setIsCrumpling(true)
    setTimeout(() => {
      onDelete(id)
    }, 300)
  }, [id, onDelete])

  useEffect(() => {
    if (isSelected) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          // Don't delete if the user is typing in a textarea or input
          const activeElement = document.activeElement
          if (activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')) {
            return
          }
          e.preventDefault()
          handleDelete()
        }
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSelected, id, handleDelete])

  return (
    <div
      ref={noteRef}
      data-testid="sticky-note"
      className={`absolute w-48 h-48 cursor-move transition-all duration-300 ${
        isDragging ? 'opacity-50' : ''
      } ${isSelected ? 'z-10' : ''} ${
        isCrumpling ? 'animate-crumple' : ''
      }`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: isCrumpling ? 'scale(0) rotate(360deg)' : 'scale(1) rotate(0deg)',
        transition: isCrumpling ? 'transform 0.3s ease-in' : '',
      }}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
    >
      {/* Main sticky note body */}
      <div className={`relative w-full h-full bg-yellow-300 shadow-md overflow-hidden ${
        isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      } ${!isDragging ? 'hover:shadow-lg' : 'shadow-xl'}`}>
        {/* Folded corner - bottom right with curved design */}
        <div className="absolute bottom-0 right-0 w-12 h-12 pointer-events-none">
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            className="absolute bottom-0 right-0"
            style={{ filter: 'drop-shadow(-1px -1px 2px rgba(0,0,0,0.15))' }}
          >
            {/* Shadow gradient under the fold */}
            <defs>
              <linearGradient id={`foldShadow-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="rgba(251, 191, 36, 0.1)" />
                <stop offset="100%" stopColor="rgba(217, 119, 6, 0.3)" />
              </linearGradient>
              <linearGradient id={`foldFront-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="50%" stopColor="#fde68a" />
                <stop offset="100%" stopColor="#fcd34d" />
              </linearGradient>
              <filter id={`foldBlur-${id}`}>
                <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
              </filter>
            </defs>
            
            {/* Shadow under the fold */}
            <path
              d="M 48 20 Q 48 48 20 48 L 48 48 Z"
              fill={`url(#foldShadow-${id})`}
              opacity="0.6"
            />
            
            {/* The folded corner with curve */}
            <path
              d="M 48 16 Q 48 48 16 48 L 48 48 Z"
              fill={`url(#foldFront-${id})`}
              filter={`url(#foldBlur-${id})`}
            />
            
            {/* Highlight on the fold */}
            <path
              d="M 48 18 Q 48 46 18 48 L 20 48 Q 48 48 48 20 Z"
              fill="rgba(255, 255, 255, 0.4)"
              opacity="0.7"
            />
          </svg>
        </div>
        
        <textarea
          className="w-full h-full bg-transparent resize-none outline-none text-gray-800 p-3 pb-10 pr-10"
          value={text}
          onChange={(e) => onTextChange(id, e.target.value)}
          placeholder="メモを入力..."
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
          onFocus={onSelect}
        />
      </div>
    </div>
  )
}
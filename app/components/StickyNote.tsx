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
        {/* Folded corner - bottom right */}
        <div className="absolute bottom-0 right-0 w-8 h-8">
          {/* Shadow under the fold */}
          <div className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-br from-transparent via-yellow-400/20 to-yellow-600/40" />
          {/* The folded triangle */}
          <div className="absolute bottom-0 right-0 w-0 h-0 border-b-[32px] border-b-yellow-100 border-l-[32px] border-l-transparent" 
               style={{ filter: 'drop-shadow(-2px -2px 3px rgba(0,0,0,0.2))' }} />
          {/* Inner fold highlight */}
          <div className="absolute bottom-0 right-0 w-0 h-0 border-b-[28px] border-b-yellow-50 border-l-[28px] border-l-transparent" />
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
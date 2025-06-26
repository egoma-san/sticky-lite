'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'

import { StickyColor } from '../types'

interface StickyNoteProps {
  id: string
  x: number
  y: number
  text: string
  color: StickyColor
  isSelected: boolean
  hasMultipleSelection?: boolean
  onSelect: (e?: React.MouseEvent) => void
  onTextChange: (id: string, text: string) => void
  onPositionChange: (id: string, x: number, y: number) => void
  onDelete: (id: string) => void
}

export default function StickyNote({
  id,
  x,
  y,
  text,
  color,
  isSelected,
  hasMultipleSelection = false,
  onSelect,
  onTextChange,
  onPositionChange,
  onDelete,
}: StickyNoteProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isCrumpling, setIsCrumpling] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const noteRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const getGradientColors = () => {
    switch (color) {
      case 'blue':
        return {
          light: '#dbeafe',
          medium: '#bfdbfe',
          dark: '#93c5fd'
        }
      case 'pink':
        return {
          light: '#fce7f3',
          medium: '#fbcfe8',
          dark: '#f9a8d4'
        }
      case 'yellow':
      default:
        return {
          light: '#fef3c7',
          medium: '#fde68a',
          dark: '#fcd34d'
        }
    }
  }

  const gradientColors = getGradientColors()

  const handleDragStart = (e: React.DragEvent) => {
    // Prevent dragging when shift is held or when part of multiple selection
    if (e.shiftKey || (isSelected && hasMultipleSelection)) {
      e.preventDefault()
      return
    }
    
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
    onSelect(e)
  }
  
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    // Focus textarea after state update
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 0)
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
    // Only handle delete key if this is the only selected note
    if (isSelected && !hasMultipleSelection) {
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
  }, [isSelected, hasMultipleSelection, id, handleDelete])
  
  // Handle clicking outside to exit edit mode
  useEffect(() => {
    if (isEditing) {
      const handleClickOutside = (e: MouseEvent) => {
        if (noteRef.current && !noteRef.current.contains(e.target as Node)) {
          setIsEditing(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isEditing])
  
  // Exit edit mode when selection is lost
  useEffect(() => {
    if (!isSelected) {
      setIsEditing(false)
    }
  }, [isSelected])

  return (
    <div
      ref={noteRef}
      id={id}
      data-testid="sticky-note"
      className={`absolute w-48 h-48 transition-all duration-300 ${
        isEditing ? 'cursor-text' : 'cursor-move'
      } ${
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
      onDoubleClick={handleDoubleClick}
    >
      {/* Main sticky note body */}
      <div className={`relative w-full h-full shadow-md overflow-hidden ${
        color === 'yellow' ? 'bg-yellow-300' : 
        color === 'blue' ? 'bg-blue-300' : 
        color === 'pink' ? 'bg-pink-300' : 'bg-yellow-300'
      } ${
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
                <stop offset="50%" stopColor={`${gradientColors.medium}33`} />
                <stop offset="100%" stopColor={`${gradientColors.dark}66`} />
              </linearGradient>
              <linearGradient id={`foldFront-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={gradientColors.light} />
                <stop offset="50%" stopColor={gradientColors.medium} />
                <stop offset="100%" stopColor={gradientColors.dark} />
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
          ref={textareaRef}
          className={`w-full h-full bg-transparent resize-none outline-none text-gray-800 p-3 pb-10 pr-10 ${
            !isEditing ? 'pointer-events-none' : ''
          }`}
          value={text}
          onChange={(e) => onTextChange(id, e.target.value)}
          placeholder="メモを入力..."
          onClick={(e) => {
            e.stopPropagation()
          }}
          onDoubleClick={(e) => {
            e.stopPropagation()
            setIsEditing(true)
          }}
          onBlur={() => setIsEditing(false)}
          readOnly={!isEditing}
        />
      </div>
    </div>
  )
}
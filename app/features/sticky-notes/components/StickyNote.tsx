'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'

import { StickyColor } from '../types'
import { isModifierKeyPressed } from '../utils/platform'

interface StickyNoteProps {
  id: string
  x: number
  y: number
  text: string
  color: StickyColor
  size?: number
  fontSize?: number
  isBold?: boolean
  isItalic?: boolean
  isUnderline?: boolean
  isSelected: boolean
  hasMultipleSelection?: boolean
  isDeleting?: boolean
  onSelect: (e?: React.MouseEvent) => void
  onTextChange: (id: string, text: string) => void
  onPositionChange: (id: string, x: number, y: number) => void
  onSizeChange: (id: string, size: number) => void
  onFontSizeChange: (id: string, fontSize: number) => void
  onFormatChange: (id: string, format: { isBold?: boolean; isItalic?: boolean; isUnderline?: boolean }) => void
  onDelete: (id: string) => void
}

export default function StickyNote({
  id,
  x,
  y,
  text,
  color,
  size = 1,
  fontSize = 16,
  isBold = false,
  isItalic = false,
  isUnderline = false,
  isSelected,
  hasMultipleSelection = false,
  isDeleting = false,
  onSelect,
  onTextChange,
  onPositionChange,
  onSizeChange,
  onFontSizeChange,
  onFormatChange,
  onDelete,
}: StickyNoteProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isCrumpling, setIsCrumpling] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; size: number; corner: 'tl' | 'tr' | 'bl' | 'br'; initialX: number; initialY: number } | null>(null)
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
    // Prevent dragging when shift is held, when part of multiple selection, or when resizing
    if (e.shiftKey || (isSelected && hasMultipleSelection) || isResizing) {
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

  // Apply crumpling animation when marked for deletion
  useEffect(() => {
    if (isDeleting) {
      setIsCrumpling(true)
    }
  }, [isDeleting])

  // Handle font size and formatting keyboard shortcuts (Word-style)
  useEffect(() => {
    if (isSelected && (isEditing || !hasMultipleSelection)) {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Check if modifier key is pressed (Cmd on Mac, Ctrl on Windows)
        if (isModifierKeyPressed(e)) {
          // Font size shortcuts
          // Check for multiple key combinations for better compatibility
          if (e.shiftKey && (e.key === '>' || e.key === '.' || e.code === 'Period')) {
            e.preventDefault()
            const newSize = Math.min(fontSize + 2, 64) // Max 64px
            onFontSizeChange(id, newSize)
          } else if (e.shiftKey && (e.key === '<' || e.key === ',' || e.code === 'Comma')) {
            e.preventDefault()
            const newSize = Math.max(fontSize - 2, 10) // Min 10px
            onFontSizeChange(id, newSize)
          }
          // Alternative: Cmd/Ctrl + Plus/Minus (without Shift)
          else if (!e.shiftKey && (e.key === '+' || e.key === '=' || e.code === 'Equal')) {
            e.preventDefault()
            const newSize = Math.min(fontSize + 2, 64) // Max 64px
            onFontSizeChange(id, newSize)
          } else if (!e.shiftKey && (e.key === '-' || e.code === 'Minus')) {
            e.preventDefault()
            const newSize = Math.max(fontSize - 2, 10) // Min 10px
            onFontSizeChange(id, newSize)
          } 
          // Bold (Ctrl/Cmd + B)
          else if (e.key === 'b' || e.key === 'B') {
            e.preventDefault()
            onFormatChange(id, { isBold: !isBold })
          }
          // Italic (Ctrl/Cmd + I)
          else if (e.key === 'i' || e.key === 'I') {
            e.preventDefault()
            onFormatChange(id, { isItalic: !isItalic })
          }
          // Underline (Ctrl/Cmd + U)
          else if (e.key === 'u' || e.key === 'U') {
            e.preventDefault()
            onFormatChange(id, { isUnderline: !isUnderline })
          }
        }
      }
      
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSelected, isEditing, hasMultipleSelection, fontSize, isBold, isItalic, isUnderline, id, onFontSizeChange, onFormatChange])

  const handleResizeMouseDown = (e: React.MouseEvent, corner: 'tl' | 'tr' | 'bl' | 'br') => {
    e.stopPropagation()
    e.preventDefault()
    setIsResizing(true)
    setResizeStart({ x: e.clientX, y: e.clientY, size, corner, initialX: x, initialY: y })
  }

  useEffect(() => {
    if (isResizing && resizeStart) {
      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - resizeStart.x
        const deltaY = e.clientY - resizeStart.y
        
        // Determine resize direction based on corner
        let delta = 0
        let newX = resizeStart.initialX
        let newY = resizeStart.initialY
        
        const initialSize = 192 * resizeStart.size
        
        switch (resizeStart.corner) {
          case 'tl': // Top-left: fix bottom-right
            delta = Math.max(Math.abs(deltaX), Math.abs(deltaY)) * (deltaX + deltaY < 0 ? 1 : -1)
            break
          case 'tr': // Top-right: fix bottom-left
            delta = Math.max(Math.abs(deltaX), Math.abs(deltaY)) * (deltaX - deltaY > 0 ? 1 : -1)
            break
          case 'bl': // Bottom-left: fix top-right
            delta = Math.max(Math.abs(deltaX), Math.abs(deltaY)) * (-deltaX + deltaY > 0 ? 1 : -1)
            break
          case 'br': // Bottom-right: fix top-left
            delta = Math.max(Math.abs(deltaX), Math.abs(deltaY)) * (deltaX + deltaY > 0 ? 1 : -1)
            break
        }
        
        // Calculate new size
        const newSize = Math.max(0.5, Math.min(3, resizeStart.size + delta / 200))
        const newSizePx = 192 * newSize
        const sizeDiff = newSizePx - initialSize
        
        // Adjust position based on which corner is being dragged
        switch (resizeStart.corner) {
          case 'tl': // Moving top-left, bottom-right stays fixed
            newX = resizeStart.initialX - sizeDiff
            newY = resizeStart.initialY - sizeDiff
            break
          case 'tr': // Moving top-right, bottom-left stays fixed
            newX = resizeStart.initialX
            newY = resizeStart.initialY - sizeDiff
            break
          case 'bl': // Moving bottom-left, top-right stays fixed
            newX = resizeStart.initialX - sizeDiff
            newY = resizeStart.initialY
            break
          case 'br': // Moving bottom-right, top-left stays fixed
            // Position stays the same
            break
        }
        
        onSizeChange(id, newSize)
        onPositionChange(id, newX, newY)
      }

      const handleMouseUp = () => {
        setIsResizing(false)
        setResizeStart(null)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing, resizeStart, id, x, y, onSizeChange, onPositionChange])

  return (
    <div
      ref={noteRef}
      id={id}
      data-testid="sticky-note"
      className={`absolute transition-all duration-300 ${
        isEditing ? 'cursor-text' : isResizing ? 'cursor-nwse-resize' : 'cursor-move'
      } ${
        isDragging ? 'opacity-50' : ''
      } ${isSelected ? 'z-10' : ''} ${
        isCrumpling ? 'animate-crumple' : ''
      }`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${192 * size}px`,
        height: `${192 * size}px`,
        transform: isCrumpling ? 'scale(0) rotate(360deg)' : 'scale(1) rotate(0deg)',
        transition: isCrumpling ? 'transform 0.3s ease-in' : isResizing ? '' : 'width 0.2s ease-out, height 0.2s ease-out',
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
          style={{ 
            fontSize: `${fontSize}px`, 
            lineHeight: 1.5,
            fontWeight: isBold ? 'bold' : 'normal',
            fontStyle: isItalic ? 'italic' : 'normal',
            textDecoration: isUnderline ? 'underline' : 'none'
          }}
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
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              setIsEditing(false)
              // Keep focus on the note but exit edit mode
              noteRef.current?.focus()
            }
          }}
          readOnly={!isEditing}
        />
      </div>
      
      {/* Resize handles */}
      {isSelected && !hasMultipleSelection && (
        <>
          {/* Top-left */}
          <div
            className="absolute -top-2 -left-2 w-4 h-4 bg-white rounded-full shadow-md cursor-nwse-resize hover:scale-110 transition-transform"
            onMouseDown={(e) => handleResizeMouseDown(e, 'tl')}
            data-testid="resize-handle-tl"
          />
          {/* Top-right */}
          <div
            className="absolute -top-2 -right-2 w-4 h-4 bg-white rounded-full shadow-md cursor-nesw-resize hover:scale-110 transition-transform"
            onMouseDown={(e) => handleResizeMouseDown(e, 'tr')}
            data-testid="resize-handle-tr"
          />
          {/* Bottom-left */}
          <div
            className="absolute -bottom-2 -left-2 w-4 h-4 bg-white rounded-full shadow-md cursor-nesw-resize hover:scale-110 transition-transform"
            onMouseDown={(e) => handleResizeMouseDown(e, 'bl')}
            data-testid="resize-handle-bl"
          />
          {/* Bottom-right */}
          <div
            className="absolute -bottom-2 -right-2 w-4 h-4 bg-white rounded-full shadow-md cursor-nwse-resize hover:scale-110 transition-transform"
            onMouseDown={(e) => handleResizeMouseDown(e, 'br')}
            data-testid="resize-handle-br"
          />
        </>
      )}
    </div>
  )
}
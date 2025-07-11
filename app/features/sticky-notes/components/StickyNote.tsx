'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'

import { StickyColor } from '../types'
import { isModifierKeyPressed } from '../utils/platform'
import RichTextEditor from './RichTextEditor'

interface StickyNoteProps {
  id: string
  x: number
  y: number
  text: string
  richText?: string
  color: StickyColor
  size?: number
  fontSize?: number
  isBold?: boolean
  isItalic?: boolean
  isUnderline?: boolean
  isSelected: boolean
  hasMultipleSelection?: boolean
  isDeleting?: boolean
  deletionType?: 'crumple' | 'peel' | 'origami'
  onSelect: (e?: React.MouseEvent) => void
  onTextChange: (id: string, text: string, richText?: string) => void
  onPositionChange: (id: string, x: number, y: number) => void
  onSizeChange: (id: string, size: number) => void
  onColorChange: (id: string, color: StickyColor) => void
  onFontSizeChange: (id: string, fontSize: number) => void
  onFormatChange: (id: string, format: { isBold?: boolean; isItalic?: boolean; isUnderline?: boolean }) => void
  onDelete: (id: string) => void
  zIndex?: number
  onDragStart?: () => void
  onEditingChange?: (isEditing: boolean) => void
  onEditorRef?: (ref: HTMLDivElement | null) => void
  onContextMenu?: (e: React.MouseEvent | React.TouchEvent, stickyId: string) => void
  allowTextSelection?: boolean
}

export default function StickyNote({
  id,
  x,
  y,
  text,
  richText,
  color,
  size = 1,
  fontSize = 16,
  isBold = false,
  isItalic = false,
  isUnderline = false,
  isSelected,
  hasMultipleSelection = false,
  isDeleting = false,
  deletionType = 'crumple',
  onSelect,
  onTextChange,
  onPositionChange,
  onSizeChange,
  onColorChange,
  onFontSizeChange,
  onFormatChange,
  onDelete,
  zIndex = 0,
  onDragStart,
  onEditingChange,
  onEditorRef,
  onContextMenu,
}: StickyNoteProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isCrumpling, setIsCrumpling] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; size: number; corner: 'tl' | 'tr' | 'bl' | 'br'; initialX: number; initialY: number } | null>(null)
  const [peelAnimationType, setPeelAnimationType] = useState<'peel-off' | 'peel-corner'>('peel-off')
  const [origamiType, setOrigamiType] = useState<'crane' | 'plane'>('crane')
  const [localSize, setLocalSize] = useState<number | null>(null)
  const [localPosition, setLocalPosition] = useState<{ x: number; y: number } | null>(null)
  const noteRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [touchStartTime, setTouchStartTime] = useState(0)
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 })
  const [hasTouchMoved, setHasTouchMoved] = useState(false)
  
  // Use local state if available, otherwise use props
  const displaySize = localSize !== null ? localSize : size
  const displayPosition = localPosition !== null ? localPosition : { x, y }
  
  // Sync local state with props when props change (and we're not resizing)
  useEffect(() => {
    if (!isResizing) {
      setLocalSize(size)
      setLocalPosition({ x, y })
    }
  }, [size, x, y, isResizing])
  

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
      case 'green':
        return {
          light: '#d1fae5',
          medium: '#a7f3d0',
          dark: '#86efac'
        }
      case 'purple':
        return {
          light: '#f3e8ff',
          medium: '#e9d5ff',
          dark: '#d8b4fe'
        }
      case 'orange':
        return {
          light: '#fed7aa',
          medium: '#fec989',
          dark: '#fdba74'
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
    
    // Bring to front when dragging starts
    if (onDragStart) {
      onDragStart()
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
    // Don't stop propagation if shift is held to allow Board to handle selection
    if (!e.shiftKey) {
      e.stopPropagation()
    }
    onSelect(e)
  }
  
  // Handle touch events for long press context menu
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchStartTime(Date.now())
    setTouchStartPos({ x: touch.clientX, y: touch.clientY })
    setHasTouchMoved(false)
    
    // Start long press timer
    longPressTimerRef.current = setTimeout(() => {
      if (!hasTouchMoved && onContextMenu) {
        e.preventDefault()
        // Trigger haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(50)
        }
        onContextMenu(e, id)
      }
    }, 500) // 500ms for long press
  }
  
  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    const moveDistance = Math.sqrt(
      Math.pow(touch.clientX - touchStartPos.x, 2) + 
      Math.pow(touch.clientY - touchStartPos.y, 2)
    )
    
    // If moved more than 10 pixels, cancel long press
    if (moveDistance > 10) {
      setHasTouchMoved(true)
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
    }
  }
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    
    // Handle tap if it was a quick touch without movement
    const touchDuration = Date.now() - touchStartTime
    if (touchDuration < 500 && !hasTouchMoved) {
      handleClick(e as any)
    }
  }
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [])
  
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    onEditingChange?.(true)
  }

  const handleDelete = useCallback(() => {
    // This is handled by Board component now
    onDelete(id)
  }, [id, onDelete])

  useEffect(() => {
    // Only handle delete key if this is the only selected note
    if (isSelected && !hasMultipleSelection && !isEditing) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          console.log(`[StickyNote ${id}] Delete key pressed`)
          console.log(`[StickyNote ${id}] isEditing:`, isEditing)
          console.log(`[StickyNote ${id}] activeElement:`, document.activeElement)
          
          // Don't delete if the user is typing in a textarea, input, or contenteditable
          const activeElement = document.activeElement
          if (activeElement && (
            activeElement.tagName === 'TEXTAREA' || 
            activeElement.tagName === 'INPUT' ||
            activeElement.getAttribute('contenteditable') === 'true' ||
            activeElement.closest('[contenteditable="true"]')
          )) {
            console.log(`[StickyNote ${id}] Blocked: active element is editable`)
            return
          }
          console.log(`[StickyNote ${id}] Deleting sticky note`)
          e.preventDefault()
          handleDelete()
        }
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSelected, hasMultipleSelection, isEditing, id, handleDelete])
  
  // Handle clicking outside to exit edit mode
  useEffect(() => {
    if (isEditing) {
      const handleClickOutside = (e: MouseEvent) => {
        if (noteRef.current && !noteRef.current.contains(e.target as Node)) {
          setIsEditing(false)
          onEditingChange?.(false)
          onEditorRef?.(null)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isEditing, onEditingChange, onEditorRef])
  
  // Exit edit mode when selection is lost
  useEffect(() => {
    if (!isSelected) {
      setIsEditing(false)
      onEditingChange?.(false)
      onEditorRef?.(null)
    }
  }, [isSelected, onEditingChange, onEditorRef])

  // Apply crumpling animation when marked for deletion
  useEffect(() => {
    if (isDeleting) {
      setIsCrumpling(true)
      // Randomly select animation type
      if (deletionType === 'peel') {
        setPeelAnimationType(Math.random() > 0.5 ? 'peel-off' : 'peel-corner')
      } else if (deletionType === 'origami') {
        setOrigamiType(Math.random() > 0.5 ? 'crane' : 'plane')
      }
    }
  }, [isDeleting, deletionType])

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
          // Text formatting shortcuts are now handled by RichTextEditor
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
    setLocalSize(size)
    setLocalPosition({ x, y })
    setResizeStart({ x: e.clientX, y: e.clientY, size, corner, initialX: x, initialY: y })
  }

  useEffect(() => {
    if (isResizing && resizeStart) {
      const handleMouseMove = (e: MouseEvent) => {
        // Get board element to calculate relative mouse position
        const boardElement = document.querySelector('[data-testid="board-canvas"]') as HTMLElement
        if (!boardElement) return
        
        const rect = boardElement.getBoundingClientRect()
        const scale = parseFloat(boardElement.style.transform.match(/scale\(([\d.]+)\)/)?.[1] || '1')
        
        // Calculate mouse position relative to the board (accounting for scale)
        const mouseX = (e.clientX - rect.left) / scale
        const mouseY = (e.clientY - rect.top) / scale
        
        const initialSize = 192 * resizeStart.size
        let newX = resizeStart.initialX
        let newY = resizeStart.initialY
        let newSizePx = initialSize
        
        // Calculate new size based on which corner is being dragged
        // The size should make the corner follow the mouse position
        switch (resizeStart.corner) {
          case 'tl': // Top-left corner follows mouse
            const widthFromTL = (resizeStart.initialX + initialSize) - mouseX
            const heightFromTL = (resizeStart.initialY + initialSize) - mouseY
            newSizePx = Math.max(widthFromTL, heightFromTL)
            newX = resizeStart.initialX + initialSize - newSizePx
            newY = resizeStart.initialY + initialSize - newSizePx
            break
            
          case 'tr': // Top-right corner follows mouse
            const widthFromTR = mouseX - resizeStart.initialX
            const heightFromTR = (resizeStart.initialY + initialSize) - mouseY
            newSizePx = Math.max(widthFromTR, heightFromTR)
            newY = resizeStart.initialY + initialSize - newSizePx
            break
            
          case 'bl': // Bottom-left corner follows mouse
            const widthFromBL = (resizeStart.initialX + initialSize) - mouseX
            const heightFromBL = mouseY - resizeStart.initialY
            newSizePx = Math.max(widthFromBL, heightFromBL)
            newX = resizeStart.initialX + initialSize - newSizePx
            break
            
          case 'br': // Bottom-right corner follows mouse
            const widthFromBR = mouseX - resizeStart.initialX
            const heightFromBR = mouseY - resizeStart.initialY
            newSizePx = Math.max(widthFromBR, heightFromBR)
            break
        }
        
        // Convert pixel size to scale factor and apply constraints
        const newSize = Math.max(0.5, Math.min(3, newSizePx / 192))
        
        // Ensure minimum size
        newSizePx = Math.max(96, newSizePx) // Minimum 96px (0.5 * 192)
        
        // Recalculate the actual size to use
        const actualSize = newSizePx / 192
        
        // Update local state only during resize
        setLocalSize(actualSize)
        setLocalPosition({ x: newX, y: newY })
      }

      const handleMouseUp = () => {
        // Save final size and position to database
        if (localSize !== null && localSize !== size) {
          onSizeChange(id, localSize)
        }
        if (localPosition && (localPosition.x !== x || localPosition.y !== y)) {
          onPositionChange(id, localPosition.x, localPosition.y)
        }
        
        // Clear resize state
        setIsResizing(false)
        setResizeStart(null)
        // Don't clear local state - keep it synced with the new values
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing, resizeStart, id, size, x, y, localSize, localPosition, onSizeChange, onPositionChange])

  return (
    <>
      <div
        ref={noteRef}
        id={id}
        data-testid="sticky-note"
        className={`absolute transition-all duration-300 ${
          isEditing ? 'cursor-text' : isResizing ? 'cursor-nwse-resize' : 'cursor-move'
        } ${
          isDragging ? 'opacity-50' : ''
        } ${isSelected ? 'z-10' : ''} ${
          isCrumpling ? (
            deletionType === 'peel' ? `animate-${peelAnimationType}` : 
            deletionType === 'origami' ? `animate-origami-${origamiType}` :
            'animate-crumple'
          ) : ''
        } ${
          isSelected ? 'ring-4 ring-blue-500 ring-offset-4 rounded-lg' : ''
        }`}
        style={{
          left: `${displayPosition.x}px`,
          top: `${displayPosition.y}px`,
          width: `${192 * displaySize}px`,
          height: `${192 * displaySize}px`,
          transform: 'scale(1) rotate(0deg)',
          transition: isResizing ? '' : 'width 0.2s ease-out, height 0.2s ease-out, left 0.2s ease-out, top 0.2s ease-out',
          zIndex: zIndex,
        }}
        draggable={!isResizing}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => {
          e.preventDefault()
          if (onContextMenu) {
            onContextMenu(e, id)
          }
        }}
      >
      {/* Main sticky note body */}
      <div className={`relative w-full h-full overflow-hidden ${
        color === 'yellow' ? 'bg-yellow-300' : 
        color === 'blue' ? 'bg-blue-300' : 
        color === 'pink' ? 'bg-pink-300' :
        color === 'green' ? 'bg-green-300' :
        color === 'purple' ? 'bg-purple-300' :
        color === 'orange' ? 'bg-orange-300' : 'bg-yellow-300'
      } ${
        isSelected ? 'ring-4 ring-blue-500 rounded-lg' : ''
      }`}
      style={{
        boxShadow: isDragging 
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
          : isCrumpling
          ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          : '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
        transition: 'box-shadow 0.3s ease-in-out',
      }}>
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
        
        <div
          className={`w-full h-full text-gray-800 overflow-auto ${
            !isEditing ? 'pointer-events-none' : ''
          }`}
          onClick={(e) => {
            e.stopPropagation()
            if (!isEditing) {
              setIsEditing(true)
              onEditingChange?.(true)
            }
          }}
          onDoubleClick={(e) => {
            e.stopPropagation()
            setIsEditing(true)
            onEditingChange?.(true)
          }}
          onTouchStart={(e) => {
            // For iOS: handle touch to enter edit mode
            if (!isEditing) {
              e.stopPropagation()
              const touch = e.touches[0]
              const touchStartTime = Date.now()
              
              const handleTouchEnd = (endEvent: TouchEvent) => {
                const touchEndTime = Date.now()
                const touchDuration = touchEndTime - touchStartTime
                
                // Check if it's a tap (not a drag)
                if (touchDuration < 500) {
                  const endTouch = endEvent.changedTouches[0]
                  const deltaX = Math.abs(touch.clientX - endTouch.clientX)
                  const deltaY = Math.abs(touch.clientY - endTouch.clientY)
                  
                  if (deltaX < 10 && deltaY < 10) {
                    setIsEditing(true)
                    onEditingChange?.(true)
                  }
                }
                
                document.removeEventListener('touchend', handleTouchEnd)
              }
              
              document.addEventListener('touchend', handleTouchEnd)
            }
          }}
        >
          {isEditing ? (
            <RichTextEditor
              value={text}
              richText={richText}
              onChange={(newText, newRichText) => onTextChange(id, newText, newRichText)}
              onBlur={() => {
                setIsEditing(false)
                onEditingChange?.(false)
                onEditorRef?.(null)
              }}
              fontSize={fontSize}
              autoFocus={true}
              className="p-3 pb-10 pr-10"
              onEditorRef={onEditorRef}
            />
          ) : (
            <div
              className="p-3 pb-10 pr-10 w-full h-full"
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: 1.5,
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                WebkitUserSelect: isSelected ? 'text' : 'none',
                userSelect: isSelected ? 'text' : 'none',
                WebkitTouchCallout: 'none'
              }}
              dangerouslySetInnerHTML={{ 
                __html: richText || text.replace(/\n/g, '<br>') || '<span style="color: #9ca3af;">メモを入力...</span>' 
              }}
            />
          )}
        </div>
        
        {/* Resize handles */}
        {isSelected && !hasMultipleSelection && (
          <>
            {/* Top-left */}
            <div
              className="absolute w-6 h-6 bg-white border-2 border-blue-500 rounded-full shadow-lg cursor-nwse-resize hover:scale-125 transition-transform z-50"
              style={{ top: '-10px', left: '-10px' }}
              onMouseDown={(e) => handleResizeMouseDown(e, 'tl')}
              data-testid="resize-handle-tl"
            />
            {/* Top-right */}
            <div
              className="absolute w-6 h-6 bg-white border-2 border-blue-500 rounded-full shadow-lg cursor-nesw-resize hover:scale-125 transition-transform z-50"
              style={{ top: '-10px', right: '-10px' }}
              onMouseDown={(e) => handleResizeMouseDown(e, 'tr')}
              data-testid="resize-handle-tr"
            />
            {/* Bottom-left */}
            <div
              className="absolute w-6 h-6 bg-white border-2 border-blue-500 rounded-full shadow-lg cursor-nesw-resize hover:scale-125 transition-transform z-50"
              style={{ bottom: '-10px', left: '-10px' }}
              onMouseDown={(e) => handleResizeMouseDown(e, 'bl')}
              data-testid="resize-handle-bl"
            />
            {/* Bottom-right */}
            <div
              className="absolute w-6 h-6 bg-white border-2 border-blue-500 rounded-full shadow-lg cursor-nwse-resize hover:scale-125 transition-transform z-50"
              style={{ bottom: '-10px', right: '-10px' }}
              onMouseDown={(e) => handleResizeMouseDown(e, 'br')}
              data-testid="resize-handle-br"
            />
          </>
        )}
      </div>
    </div>
      
      
    </>
  )
}
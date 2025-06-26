'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useStickyStore } from '../store/useStickyStore'
import { StickyColor } from '../types'

interface AddStickyButtonProps {
  boardRef: React.RefObject<HTMLDivElement>
  scale: number
  position: { x: number; y: number }
}

export default function AddStickyButton({ boardRef, scale, position }: AddStickyButtonProps) {
  const { addSticky, selectedColor, setSelectedColor } = useStickyStore()
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [isLongPress, setIsLongPress] = useState(false)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const colors: { value: StickyColor; bg: string; hover: string }[] = [
    { value: 'yellow', bg: 'bg-yellow-300', hover: 'hover:bg-yellow-400' },
    { value: 'blue', bg: 'bg-blue-300', hover: 'hover:bg-blue-400' },
    { value: 'pink', bg: 'bg-pink-300', hover: 'hover:bg-pink-400' },
  ]

  const handleMouseDown = () => {
    setIsLongPress(false)
    longPressTimerRef.current = setTimeout(() => {
      setIsLongPress(true)
      setShowColorPicker(true)
    }, 500) // 500ms for long press
  }

  const handleMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    if (!isLongPress && !showColorPicker && boardRef.current) {
      // Short press - add sticky note at center of viewport
      const rect = boardRef.current.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      
      // Convert to canvas coordinates
      const x = (centerX - position.x) / scale - 96
      const y = (centerY - position.y) / scale - 96
      
      addSticky(x, y)
    }
    setIsLongPress(false)
  }

  const handleMouseLeave = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    setIsLongPress(false)
  }

  const handleColorSelect = (color: StickyColor) => {
    setSelectedColor(color)
    setShowColorPicker(false)
  }

  // Close color picker when clicking outside
  useEffect(() => {
    if (showColorPicker) {
      const handleClickOutside = (e: MouseEvent) => {
        if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
          setShowColorPicker(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showColorPicker])

  const currentColorClass = colors.find(c => c.value === selectedColor)?.bg || 'bg-yellow-300'

  return (
    <div className="fixed bottom-28 left-4 sm:bottom-36 sm:left-6 md:bottom-40 md:left-8 z-50">
      <div className="relative">
        {/* Color picker */}
        {showColorPicker && (
          <div className="absolute bottom-full left-0 mb-2 flex flex-col gap-2">
            {colors.map((color) => (
              <button
                key={color.value}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${color.bg} ${color.hover} 
                  transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg
                  ${selectedColor === color.value ? 'ring-2 ring-offset-2 ring-gray-600' : ''}`}
                onClick={() => handleColorSelect(color.value)}
              />
            ))}
          </div>
        )}

        {/* Add button */}
        <button
          ref={buttonRef}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center 
            transition-all duration-200 hover:scale-105 active:scale-95 relative overflow-hidden
            ${currentColorClass} shadow-lg hover:shadow-xl`}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
        >
          <span className="text-2xl sm:text-3xl font-bold text-gray-700">
            +
          </span>
        </button>
      </div>
    </div>
  )
}
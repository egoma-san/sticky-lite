'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useStickyStore } from '../store/useStickyStore'
import { StickyColor } from '../types'

interface AddStickyButtonProps {
  boardRef: React.RefObject<HTMLDivElement | null>
  scale: number
  position: { x: number; y: number }
}

export default function AddStickyButton({ boardRef, scale, position }: AddStickyButtonProps) {
  const { addSticky, selectedColor, setSelectedColor } = useStickyStore()
  const [showColorPicker, setShowColorPicker] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const colors: { value: StickyColor; bg: string; hover: string }[] = [
    { value: 'yellow', bg: 'bg-yellow-300', hover: 'hover:bg-yellow-400' },
    { value: 'blue', bg: 'bg-blue-300', hover: 'hover:bg-blue-400' },
    { value: 'pink', bg: 'bg-pink-300', hover: 'hover:bg-pink-400' },
  ]

  const handleAddClick = () => {
    if (boardRef.current) {
      // Add sticky note at center of viewport
      const rect = boardRef.current.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      
      // Convert to canvas coordinates
      const x = (centerX - position.x) / scale - 96
      const y = (centerY - position.y) / scale - 96
      
      addSticky(x, y)
    }
  }

  const handleColorSelect = (color: StickyColor) => {
    setSelectedColor(color)
  }


  // Use inline styles for dynamic colors instead of Tailwind classes
  const getColorStyle = (colorValue: StickyColor) => {
    switch (colorValue) {
      case 'blue':
        return { backgroundColor: '#93c5fd', hover: '#60a5fa' } // bg-blue-300 / bg-blue-400
      case 'pink':
        return { backgroundColor: '#f9a8d4', hover: '#f472b6' } // bg-pink-300 / bg-pink-400
      default:
        return { backgroundColor: '#fde047', hover: '#facc15' } // bg-yellow-300 / bg-yellow-400
    }
  }

  const currentColorStyle = getColorStyle(selectedColor)

  // Set up global mouse tracking when component is mounted
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      
      const buttonRect = containerRef.current.querySelector('button:last-child')?.getBoundingClientRect()
      if (!buttonRect) return
      
      const mouseX = e.clientX
      const mouseY = e.clientY
      
      // Calculate hover area that includes all color buttons
      // Color picker extends upward, so we need to account for all 3 colors
      const colorButtonHeight = 56 // Height of each color button (14 * 4 = 56px on sm screens)
      const gap = 8 // Gap between buttons
      const totalColorPickerHeight = (colorButtonHeight * 3) + (gap * 2) + 8 // 3 buttons + 2 gaps + margin
      
      const hoverPadding = 40 // Generous padding
      const isInHoverArea = 
        mouseX >= buttonRect.left - hoverPadding &&
        mouseX <= buttonRect.right + hoverPadding &&
        mouseY >= buttonRect.top - totalColorPickerHeight - hoverPadding &&
        mouseY <= buttonRect.bottom + hoverPadding
      
      if (isInHoverArea && !showColorPicker) {
        setShowColorPicker(true)
      } else if (!isInHoverArea && showColorPicker) {
        setShowColorPicker(false)
      }
    }
    
    document.addEventListener('mousemove', handleGlobalMouseMove)
    return () => document.removeEventListener('mousemove', handleGlobalMouseMove)
  }, [showColorPicker])

  return (
    <div 
      ref={containerRef}
      className="fixed bottom-28 right-4 sm:bottom-36 sm:right-6 md:bottom-40 md:right-8 z-50"
    >
      <div className="relative">
        {/* Color picker with invisible hover area */}
        <div 
          className={`absolute bottom-full right-0 mb-2 transition-all duration-200 ${
            showColorPicker ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
          }`}
        >
          {/* Invisible hover area extender - extends more vertically */}
          <div 
            className="absolute -inset-x-10 -top-12 -bottom-4 pointer-events-none"
            style={{ zIndex: -1 }}
          />
          
          {/* Actual color buttons */}
          <div className="flex flex-col gap-2">
            {colors.map((color) => {
              const colorStyle = getColorStyle(color.value)
              return (
                <button
                  key={color.value}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl
                    transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg
                    ${selectedColor === color.value ? 'ring-2 ring-offset-2 ring-gray-600' : ''}`}
                  style={{ backgroundColor: colorStyle.backgroundColor }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colorStyle.hover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colorStyle.backgroundColor}
                  onClick={() => handleColorSelect(color.value)}
                />
              )
            })}
          </div>
        </div>

        {/* Add button */}
        <button
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center 
            transition-all duration-200 hover:scale-105 active:scale-95 relative overflow-hidden
            shadow-lg hover:shadow-xl`}
          style={{ backgroundColor: currentColorStyle.backgroundColor }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentColorStyle.hover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentColorStyle.backgroundColor}
          onClick={handleAddClick}
        >
          <span className="text-2xl sm:text-3xl font-bold text-gray-700">
            +
          </span>
        </button>
      </div>
    </div>
  )
}
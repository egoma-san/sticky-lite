'use client'

import React from 'react'
import { StickyColor } from '../types'

interface StickyFormatToolbarProps {
  color: StickyColor
  fontSize: number
  isBold?: boolean
  isItalic?: boolean
  isUnderline?: boolean
  isEditing?: boolean
  activeEditor?: HTMLDivElement | null
  onColorChange: (color: StickyColor) => void
  onFontSizeChange: (size: number) => void
  onFormatChange: (format: { isBold?: boolean; isItalic?: boolean; isUnderline?: boolean }) => void
  position: 'top' | 'bottom'
  x: number
  y: number
  width: number
  height: number
}

// Feature flags
const ENABLE_FONT_SIZE = false
const ENABLE_TEXT_FORMAT = true

export default function StickyFormatToolbar({
  color,
  fontSize,
  isBold = false,
  isItalic = false,
  isUnderline = false,
  isEditing = false,
  activeEditor,
  onColorChange,
  onFontSizeChange,
  onFormatChange,
  position,
  x,
  y,
  width,
  height
}: StickyFormatToolbarProps) {
  const colors: StickyColor[] = ['yellow', 'blue', 'pink', 'green', 'purple', 'orange']
  const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32]
  
  // Calculate toolbar position
  const toolbarY = position === 'top' ? y - 60 : y + height + 10
  const toolbarX = Math.max(10, Math.min(x, window.innerWidth - 380)) // Ensure toolbar stays in viewport
  
  return (
    <div
      data-testid="format-toolbar"
      className="fixed z-50 p-3 rounded-xl shadow-2xl backdrop-blur-md bg-white/70 border border-white/30"
      style={{
        left: `${toolbarX}px`,
        top: `${toolbarY}px`,
        minWidth: ENABLE_FONT_SIZE || ENABLE_TEXT_FORMAT ? '360px' : '200px'
      }}
      onClick={(e) => e.stopPropagation()} // Prevent clicks from propagating
    >
      {/* Glass effect overlay */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-white/10 pointer-events-none" />
      
      <div className="relative flex items-center gap-3 flex-wrap">
        {/* Color picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600">色:</span>
          <div className="flex gap-1">
            {colors.map((c) => (
              <button
                key={c}
                data-testid={`color-${c}`}
                onClick={() => onColorChange(c)}
                className={`w-6 h-6 rounded-full transition-all ${
                  color === c ? 'ring-2 ring-offset-2 ring-gray-600 scale-110' : 'hover:scale-110'
                }`}
                style={{
                  backgroundColor: c === 'yellow' ? '#fde68a' :
                                  c === 'blue' ? '#93c5fd' :
                                  c === 'pink' ? '#fbcfe8' :
                                  c === 'green' ? '#86efac' :
                                  c === 'purple' ? '#d8b4fe' :
                                  '#fdba74'
                }}
                title={c}
              />
            ))}
          </div>
        </div>
        
        {ENABLE_FONT_SIZE && (
          <>
            <div className="w-px h-6 bg-gray-300" />
            
            {/* Font size */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600">サイズ:</span>
              <select
                value={fontSize}
                onChange={(e) => onFontSizeChange(Number(e.target.value))}
                className="px-2 py-1 text-sm border border-gray-300 rounded-md bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {fontSizes.map((size) => (
                  <option key={size} value={size}>
                    {size}px
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
        
        {ENABLE_TEXT_FORMAT && (
          <>
            <div className="w-px h-6 bg-gray-300" />
            
            {/* Format buttons */}
            <div className="flex items-center gap-1">
              <button
                data-testid="bold-button"
                onClick={() => onFormatChange({ isBold: !isBold })}
                className={`px-3 py-1.5 rounded transition-all font-bold text-sm ${
                  isBold 
                    ? 'bg-gray-300 text-gray-700 shadow-inner' 
                    : 'bg-white/50 hover:bg-white/80 text-gray-700'
                }`}
                title="太字 (Ctrl+B)"
              >
                B
              </button>
              
              <button
                data-testid="italic-button"
                onClick={() => onFormatChange({ isItalic: !isItalic })}
                className={`px-3 py-1.5 rounded transition-all italic text-sm ${
                  isItalic 
                    ? 'bg-gray-300 text-gray-700 shadow-inner' 
                    : 'bg-white/50 hover:bg-white/80 text-gray-700'
                }`}
                title="斜体 (Ctrl+I)"
              >
                I
              </button>
              
              <button
                data-testid="underline-button"
                onClick={() => onFormatChange({ isUnderline: !isUnderline })}
                className={`px-3 py-1.5 rounded transition-all underline text-sm ${
                  isUnderline 
                    ? 'bg-gray-300 text-gray-700 shadow-inner' 
                    : 'bg-white/50 hover:bg-white/80 text-gray-700'
                }`}
                title="下線 (Ctrl+U)"
              >
                U
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
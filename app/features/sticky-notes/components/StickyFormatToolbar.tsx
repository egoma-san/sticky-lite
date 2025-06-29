'use client'

import React from 'react'
import { StickyColor } from '../types'

interface StickyFormatToolbarProps {
  color: StickyColor
  fontSize: number
  isBold?: boolean
  isItalic?: boolean
  isUnderline?: boolean
  onColorChange: (color: StickyColor) => void
  onFontSizeChange: (size: number) => void
  onFormatChange: (format: { isBold?: boolean; isItalic?: boolean; isUnderline?: boolean }) => void
  position: 'top' | 'bottom'
  x: number
  y: number
  width: number
  height: number
}

export default function StickyFormatToolbar({
  color,
  fontSize,
  isBold = false,
  isItalic = false,
  isUnderline = false,
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
  
  console.log('StickyFormatToolbar rendering at:', { x: toolbarX, y: toolbarY, position })
  
  return (
    <div
      className="fixed z-50 p-3 rounded-xl shadow-2xl backdrop-blur-md bg-white/70 border border-white/30"
      style={{
        left: `${toolbarX}px`,
        top: `${toolbarY}px`,
        minWidth: '360px'
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
        
        <div className="w-px h-6 bg-gray-300" />
        
        {/* Format buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onFormatChange({ isBold: !isBold })}
            className={`p-1.5 rounded transition-all ${
              isBold 
                ? 'bg-gray-700 text-white shadow-inner' 
                : 'bg-white/50 hover:bg-white/80 text-gray-700'
            }`}
            title="太字 (Ctrl+B)"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6 4v12h4.5c1.5 0 2.5-1 2.5-2.5S12 11 10.5 11H8V8h2c1 0 2-1 2-2s-1-2-2-2H6zm2 2h2c.5 0 1 .5 1 1s-.5 1-1 1H8V6zm0 4h2.5c.8 0 1.5.7 1.5 1.5s-.7 1.5-1.5 1.5H8v-3z"/>
            </svg>
          </button>
          
          <button
            onClick={() => onFormatChange({ isItalic: !isItalic })}
            className={`p-1.5 rounded transition-all ${
              isItalic 
                ? 'bg-gray-700 text-white shadow-inner' 
                : 'bg-white/50 hover:bg-white/80 text-gray-700'
            }`}
            title="斜体 (Ctrl+I)"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 4h4l-2 12H6l2-12z"/>
            </svg>
          </button>
          
          <button
            onClick={() => onFormatChange({ isUnderline: !isUnderline })}
            className={`p-1.5 rounded transition-all ${
              isUnderline 
                ? 'bg-gray-700 text-white shadow-inner' 
                : 'bg-white/50 hover:bg-white/80 text-gray-700'
            }`}
            title="下線 (Ctrl+U)"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 4v7c0 1.7-1.3 3-3 3s-3-1.3-3-3V4h2v7c0 .6.4 1 1 1s1-.4 1-1V4h2zm4 0v7c0 1.7-1.3 3-3 3v-2c.6 0 1-.4 1-1V4h2zM4 16h12v2H4v-2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
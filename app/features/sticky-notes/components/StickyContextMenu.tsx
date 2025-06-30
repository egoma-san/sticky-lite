'use client'

import React, { useEffect, useRef } from 'react'
import { StickyColor } from '../types'

interface StickyContextMenuProps {
  x: number
  y: number
  color: StickyColor
  isBold?: boolean
  isItalic?: boolean
  isUnderline?: boolean
  onColorChange: (color: StickyColor) => void
  onFormatChange: (format: { isBold?: boolean; isItalic?: boolean; isUnderline?: boolean }) => void
  onDelete: () => void
  onClose: () => void
}

export default function StickyContextMenu({
  x,
  y,
  color,
  isBold = false,
  isItalic = false,
  isUnderline = false,
  onColorChange,
  onFormatChange,
  onDelete,
  onClose
}: StickyContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const colors: StickyColor[] = ['yellow', 'blue', 'pink', 'green', 'purple', 'orange']
  
  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    
    // Add slight delay to prevent immediate close on touch
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }, 100)
    
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [onClose])
  
  // Adjust position to stay within viewport
  const adjustedPosition = () => {
    const menuWidth = 280
    const menuHeight = 300
    const padding = 10
    
    let adjustedX = x
    let adjustedY = y
    
    // Check right edge
    if (x + menuWidth > window.innerWidth - padding) {
      adjustedX = window.innerWidth - menuWidth - padding
    }
    
    // Check bottom edge
    if (y + menuHeight > window.innerHeight - padding) {
      adjustedY = window.innerHeight - menuHeight - padding
    }
    
    // Check left edge
    if (adjustedX < padding) {
      adjustedX = padding
    }
    
    // Check top edge
    if (adjustedY < padding) {
      adjustedY = padding
    }
    
    return { x: adjustedX, y: adjustedY }
  }
  
  const { x: adjustedX, y: adjustedY } = adjustedPosition()
  
  return (
    <div
      ref={menuRef}
      className="fixed z-[100] bg-white rounded-2xl shadow-2xl overflow-hidden"
      style={{
        left: `${adjustedX}px`,
        top: `${adjustedY}px`,
        minWidth: '280px',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid rgba(0, 0, 0, 0.1)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Color Section */}
      <div className="p-4 border-b border-gray-100">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">色</div>
        <div className="flex gap-3 justify-center">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => {
                onColorChange(c)
                onClose()
              }}
              className={`w-10 h-10 rounded-full transition-all transform active:scale-95 ${
                color === c ? 'ring-4 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-110'
              }`}
              style={{
                backgroundColor: c === 'yellow' ? '#fde68a' :
                                c === 'blue' ? '#93c5fd' :
                                c === 'pink' ? '#fbcfe8' :
                                c === 'green' ? '#86efac' :
                                c === 'purple' ? '#d8b4fe' :
                                '#fdba74',
                boxShadow: color === c ? '0 0 0 2px white, 0 0 0 4px #3b82f6' : '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Format Section */}
      <div className="p-4 border-b border-gray-100">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">書式</div>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => {
              onFormatChange({ isBold: !isBold })
              onClose()
            }}
            className={`px-6 py-3 rounded-lg font-bold text-lg transition-all transform active:scale-95 ${
              isBold 
                ? 'bg-blue-500 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            B
          </button>
          
          <button
            onClick={() => {
              onFormatChange({ isItalic: !isItalic })
              onClose()
            }}
            className={`px-6 py-3 rounded-lg italic text-lg transition-all transform active:scale-95 ${
              isItalic 
                ? 'bg-blue-500 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            I
          </button>
          
          <button
            onClick={() => {
              onFormatChange({ isUnderline: !isUnderline })
              onClose()
            }}
            className={`px-6 py-3 rounded-lg underline text-lg transition-all transform active:scale-95 ${
              isUnderline 
                ? 'bg-blue-500 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            U
          </button>
        </div>
      </div>
      
      {/* Delete Section */}
      <div className="p-2">
        <button
          onClick={() => {
            onDelete()
            onClose()
          }}
          className="w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          削除
        </button>
      </div>
    </div>
  )
}
'use client'

import React, { useState, useRef, useEffect } from 'react'

interface ZoomControlsProps {
  scale: number
  minScale: number
  maxScale: number
  onScaleChange: (scale: number) => void
}

export default function ZoomControls({ scale, minScale, maxScale, onScaleChange }: ZoomControlsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  
  const percentage = Math.round(scale * 100)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleZoomIn = () => {
    const newScale = Math.min(maxScale, scale * 1.2)
    onScaleChange(newScale)
  }

  const handleZoomOut = () => {
    const newScale = Math.max(minScale, scale * 0.8)
    onScaleChange(newScale)
  }

  const handlePercentageClick = () => {
    setInputValue(percentage.toString())
    setIsEditing(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '')
    setInputValue(value)
  }

  const handleInputBlur = () => {
    applyPercentage()
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      applyPercentage()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setInputValue('')
    }
  }

  const applyPercentage = () => {
    const value = parseInt(inputValue)
    if (!isNaN(value) && value > 0) {
      const newPercentage = Math.min(200, Math.max(10, value))
      const newScale = newPercentage / 100
      if (Math.abs(newScale - scale) > 0.001) { // Only call if scale actually changes
        onScaleChange(newScale)
      }
    }
    setIsEditing(false)
    setInputValue('')
  }

  const buttonStyle = {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 100%)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08), inset 0 2px 4px rgba(255, 255, 255, 0.9)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
  }

  const textStyle = {
    background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.9) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)',
    filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1))'
  }

  return (
    <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 md:bottom-8 md:left-8 flex items-center gap-2 z-50">
      <button
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 relative overflow-hidden"
        style={buttonStyle}
        onClick={handleZoomOut}
      >
        <span className="text-xl sm:text-2xl font-medium relative z-10" style={textStyle}>
          −
        </span>
      </button>

      <div 
        className="h-12 sm:h-14 px-4 rounded-2xl flex items-center justify-center min-w-[80px] cursor-pointer relative"
        style={buttonStyle}
        onClick={handlePercentageClick}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="w-full text-center bg-transparent outline-none text-sm sm:text-base font-medium"
            style={{ color: 'rgba(0, 0, 0, 0.8)' }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="text-sm sm:text-base font-medium" style={{ color: 'rgba(0, 0, 0, 0.8)' }}>
            {percentage}%
          </span>
        )}
      </div>

      <button
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 relative overflow-hidden"
        style={buttonStyle}
        onClick={handleZoomIn}
      >
        <span className="text-xl sm:text-2xl font-medium relative z-10" style={textStyle}>
          +
        </span>
      </button>
    </div>
  )
}
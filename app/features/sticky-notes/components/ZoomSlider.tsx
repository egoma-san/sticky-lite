'use client'

import React, { useRef, useState, useEffect } from 'react'

interface ZoomSliderProps {
  scale: number
  minScale: number
  maxScale: number
  onScaleChange: (scale: number) => void
}

export default function ZoomSlider({ scale, minScale, maxScale, onScaleChange }: ZoomSliderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const sliderRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  // Convert scale to slider position (0-100)
  const scaleToPosition = (s: number) => {
    return ((s - minScale) / (maxScale - minScale)) * 100
  }

  // Convert slider position to scale
  const positionToScale = (pos: number) => {
    return minScale + (pos / 100) * (maxScale - minScale)
  }

  const handleDrag = (clientY: number) => {
    if (!trackRef.current) return
    
    const rect = trackRef.current.getBoundingClientRect()
    const y = clientY - rect.top - 10 // Offset for triangle top
    const availableHeight = 145 // Height of the triangle track
    
    // Calculate position (0 at bottom, 100 at top)
    const rawPosition = (1 - Math.min(Math.max(0, y), availableHeight) / availableHeight) * 100
    const position = Math.min(100, Math.max(0, rawPosition))
    const newScale = positionToScale(position)
    
    onScaleChange(newScale)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    handleDrag(e.clientY)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      handleDrag(e.clientY)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    setIsDragging(true)
    handleDrag(e.touches[0].clientY)
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging && e.touches.length > 0) {
      handleDrag(e.touches[0].clientY)
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('touchmove', handleTouchMove)
      window.addEventListener('touchend', handleTouchEnd)
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
        window.removeEventListener('touchmove', handleTouchMove)
        window.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isDragging])

  const position = scaleToPosition(scale)
  const zoomPercentage = Math.round(((scale - minScale) / (maxScale - minScale)) * 100)

  return (
    <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 md:bottom-8 md:left-8 z-50">
      <div className="relative">
        {/* Glass triangle (pointing up) */}
        <div 
          className="relative"
          style={{
            width: '40px',
            height: '160px',
          }}
        >
          <svg 
            width="40" 
            height="160" 
            viewBox="0 0 40 160" 
            className="cursor-pointer absolute inset-0"
            style={{ zIndex: 1 }}
          >
            <defs>
              <clipPath id="triangleClip">
                <path d="M 5 10 L 35 10 L 20 155 Z" />
              </clipPath>
            </defs>
            
            {/* Glass background */}
            <g clipPath="url(#triangleClip)">
              <rect 
                x="0" 
                y="0" 
                width="40" 
                height="160" 
                fill="rgba(255, 255, 255, 0.2)"
              />
            </g>
            
            {/* Triangle outline */}
            <path
              d="M 5 10 L 35 10 L 20 155 Z"
              fill="none"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="1"
            />
          </svg>
          
          {/* Glass effect background */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              clipPath: 'polygon(12.5% 6%, 87.5% 6%, 50% 97%)',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px) saturate(180%)',
              WebkitBackdropFilter: 'blur(10px) saturate(180%)',
            }}
          />
        </div>
        
        {/* Glass circle slider */}
        <div
          ref={sliderRef}
          className={`absolute left-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing ${
            isDragging ? 'scale-110' : 'hover:scale-105'
          } transition-transform duration-150`}
          style={{
            width: '32px',
            height: '32px',
            top: `${10 + (145 * (1 - position / 100))}px`,
            marginLeft: '-16px',
            zIndex: 2,
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div 
            className="w-full h-full rounded-full relative"
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px) saturate(200%)',
              WebkitBackdropFilter: 'blur(20px) saturate(200%)',
              boxShadow: `
                0 4px 16px rgba(0, 0, 0, 0.1),
                inset 0 0 0 1px rgba(255, 255, 255, 1),
                inset 0 2px 4px rgba(255, 255, 255, 1)
              `,
              border: '1px solid rgba(255, 255, 255, 0.5)',
            }}
          >
            {/* Inner shine */}
            <div 
              className="absolute inset-1 rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, transparent 60%)',
              }}
            />
          </div>
        </div>
        
        {/* Invisible extended hit area for dragging */}
        <div
          ref={trackRef}
          className="absolute inset-0 -inset-x-4"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={{ zIndex: 3 }}
        />
        
        {/* Zoom level tooltip */}
        {isDragging && (
          <div 
            className="absolute left-full ml-4 px-2 py-1 rounded text-xs font-medium whitespace-nowrap pointer-events-none"
            style={{
              top: `${10 + (145 * (1 - position / 100))}px`,
              transform: 'translateY(-50%)',
              background: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              zIndex: 4,
            }}
          >
            {Math.round(scale * 100)}%
          </div>
        )}
      </div>
    </div>
  )
}
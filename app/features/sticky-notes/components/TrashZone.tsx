'use client'

import React, { useState } from 'react'

interface TrashZoneProps {
  onDrop: (stickyId: string) => void
  onDeleteSelected?: () => void
}

export default function TrashZone({ onDrop, onDeleteSelected }: TrashZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const stickyId = e.dataTransfer.getData('stickyId')
    if (stickyId) {
      onDrop(stickyId)
    }
  }

  const handleClick = () => {
    if (onDeleteSelected) {
      onDeleteSelected()
    }
  }

  return (
    <button
      data-testid="trash-zone"
      className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center transition-all duration-200 relative overflow-hidden z-50 ${
        isDragOver 
          ? 'scale-110' 
          : 'hover:scale-105'
      }`}
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        background: isDragOver 
          ? 'linear-gradient(135deg, rgba(255, 69, 58, 0.9) 0%, rgba(255, 59, 48, 0.7) 100%)' 
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 100%)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        boxShadow: `0 8px 32px ${isDragOver ? 'rgba(255, 59, 48, 0.3)' : 'rgba(0, 0, 0, 0.12)'}, 0 1px 2px rgba(0, 0, 0, 0.08), inset 0 2px 4px rgba(255, 255, 255, 0.9)`,
        border: '1px solid rgba(255, 255, 255, 0.5)',
      }}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <div className="relative z-10">
        <svg
          className="w-8 h-8 sm:w-10 sm:h-10"
          fill="none"
          viewBox="0 0 24 24"
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
          }}
        >
          <defs>
            <linearGradient id={`trashGradient-${isDragOver ? 'active' : 'idle'}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isDragOver ? '#FFFFFF' : '#EF4444'} stopOpacity="0.9" />
              <stop offset="100%" stopColor={isDragOver ? '#FFE5E5' : '#DC2626'} stopOpacity="1" />
            </linearGradient>
            <filter id="innerShadow">
              <feGaussianBlur in="SourceAlpha" stdDeviation="0.5"/>
              <feOffset dx="0" dy="1" result="offsetblur"/>
              <feFlood floodColor="#000000" floodOpacity="0.1"/>
              <feComposite in2="offsetblur" operator="in"/>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <path
            stroke={`url(#trashGradient-${isDragOver ? 'active' : 'idle'})`}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            filter="url(#innerShadow)"
          />
        </svg>
      </div>
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, transparent 50%)',
          borderRadius: 'inherit'
        }}
      />
    </button>
  )
}
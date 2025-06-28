'use client'

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useStickyStore } from '../store/useStickyStore'
import StickyNote from './StickyNote'
import TrashZone from './TrashZone'
import AddStickyButton from './AddStickyButton'
import ZoomControls from './ZoomControls'
import InfoButton from './InfoButton'
import { isModifierKeyPressed } from '../utils/platform'
import { playPaperSound } from '../utils/deletionSounds'

function BoardContent() {
  const searchParams = useSearchParams()
  const focusId = searchParams?.get('focus') || null
  const { stickies, addSticky, updateStickyText, updateStickyPosition, updateStickySize, updateStickyFontSize, updateStickyFormat, deleteSticky, deleteMultiple } = useStickyStore()
  
  // Initialize with default values to avoid hydration mismatch
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [mouseDownPos, setMouseDownPos] = useState({ x: 0, y: 0 })
  const [hasDragged, setHasDragged] = useState(false)
  const [selectedStickyIds, setSelectedStickyIds] = useState<Set<string>>(new Set())
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 })
  const [isMovingSelection, setIsMovingSelection] = useState(false)
  const [moveStart, setMoveStart] = useState<{ x: number; y: number; positions: Map<string, { x: number; y: number }> } | null>(null)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [deletionType, setDeletionType] = useState<'crumple' | 'peel'>('crumple')
  const boardRef = useRef<HTMLDivElement>(null)
  const canvasSize = 10000 // Large canvas for open world
  const initialOffset = canvasSize / 2 // Center the view
  
  // Calculate minimum scale to prevent showing outside canvas
  const getMinScale = () => {
    if (!boardRef.current) return 0.1
    const rect = boardRef.current.getBoundingClientRect()
    const minScaleX = rect.width / canvasSize
    const minScaleY = rect.height / canvasSize
    return Math.max(minScaleX, minScaleY, 0.1)
  }
  
  // Constrain position to keep canvas in view
  const constrainPosition = (pos: { x: number; y: number }, currentScale: number) => {
    if (!boardRef.current) return pos
    const rect = boardRef.current.getBoundingClientRect()
    
    // Calculate bounds
    const minX = rect.width - canvasSize * currentScale
    const maxX = 0
    const minY = rect.height - canvasSize * currentScale
    const maxY = 0
    
    return {
      x: Math.min(Math.max(pos.x, minX), maxX),
      y: Math.min(Math.max(pos.y, minY), maxY)
    }
  }
  
  // Load saved view state after mount
  useEffect(() => {
    const saved = localStorage.getItem('board-view-state')
    if (saved) {
      try {
        const viewState = JSON.parse(saved)
        if (viewState.scale) {
          const minScale = getMinScale()
          const constrainedScale = Math.max(minScale, viewState.scale)
          setScale(constrainedScale)
          
          if (viewState.position) {
            const constrainedPos = constrainPosition(viewState.position, constrainedScale)
            setPosition(constrainedPos)
          }
        }
      } catch (e) {
        console.error('Failed to load view state:', e)
      }
    } else {
      // Center the view on initial load
      const centerX = window.innerWidth / 2 - initialOffset
      const centerY = window.innerHeight / 2 - initialOffset
      setPosition({ x: centerX, y: centerY })
    }
  }, [initialOffset])

  // Focus on specific sticky note when navigating from list view
  useEffect(() => {
    if (focusId && boardRef.current) {
      const targetSticky = stickies.find(s => s.id === focusId)
      if (targetSticky) {
        const rect = boardRef.current.getBoundingClientRect()
        const stickySize = targetSticky.size || 1
        const stickyWidth = 192 * stickySize
        const stickyHeight = 192 * stickySize
        
        // Calculate position to center the sticky note in the viewport
        const centerX = rect.width / 2
        const centerY = rect.height / 2
        
        // Calculate new position
        const newPosition = {
          x: centerX - (targetSticky.x + stickyWidth / 2) * scale,
          y: centerY - (targetSticky.y + stickyHeight / 2) * scale
        }
        
        // Constrain position
        const constrainedPos = constrainPosition(newPosition, scale)
        setPosition(constrainedPos)
        
        // Select the sticky note
        setSelectedStickyIds(new Set([focusId]))
        
        // Clear the focus parameter from URL
        const url = new URL(window.location.href)
        url.searchParams.delete('focus')
        window.history.replaceState({}, '', url.toString())
      }
    }
  }, [focusId, stickies, scale])

  // Play sound and animate before deleting
  const handleDeleteWithAnimation = useCallback((ids: string[], type: 'crumple' | 'peel' = 'crumple') => {
    // Set deletion type for animation
    setDeletionType(type)
    
    // Play appropriate sound
    playPaperSound(type)
    
    // Add to deleting set
    setDeletingIds(new Set(ids))
    
    // Delete after animation
    const animationDuration = type === 'peel' ? 600 : 500
    setTimeout(() => {
      if (ids.length === 1) {
        deleteSticky(ids[0])
      } else {
        deleteMultiple(ids)
      }
      setDeletingIds(new Set())
      setDeletionType('crumple') // Reset to default
    }, animationDuration)
  }, [deleteSticky, deleteMultiple])

  const handleBoardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only deselect when clicking on empty background (not when dragging)
    if ((e.target as HTMLElement).dataset.testid === 'board-canvas' && !hasDragged) {
      setSelectedStickyIds(new Set())
    }
  }

  const handleBoardDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Create sticky on double-click
    if ((e.target as HTMLElement).dataset.testid === 'board-canvas') {
      const rect = boardRef.current?.getBoundingClientRect()
      if (rect) {
        const x = (e.clientX - rect.left - position.x) / scale
        const y = (e.clientY - rect.top - position.y) / scale
        addSticky(x, y)
      }
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (isModifierKeyPressed(e)) {
      e.preventDefault()
      const rect = boardRef.current?.getBoundingClientRect()
      if (!rect) return
      
      // Get mouse position relative to board
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      
      // Calculate the point on canvas where mouse is pointing (before zoom)
      const canvasX = (mouseX - position.x) / scale
      const canvasY = (mouseY - position.y) / scale
      
      // Calculate new scale with minimum constraint
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const minScale = getMinScale()
      const newScale = Math.min(Math.max(minScale, scale * delta), 2.0)
      
      // Calculate new position to keep the same canvas point under mouse
      const newPos = {
        x: mouseX - canvasX * newScale,
        y: mouseY - canvasY * newScale
      }
      
      // Constrain position to keep canvas in view
      const constrainedPos = constrainPosition(newPos, newScale)
      
      setScale(newScale)
      setPosition(constrainedPos)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setMouseDownPos({ x: e.clientX, y: e.clientY })
    setHasDragged(false)
    
    // Start selection box with shift+drag anywhere
    if (e.button === 0 && e.shiftKey) {
      e.preventDefault()
      const rect = boardRef.current?.getBoundingClientRect()
      if (rect) {
        const startX = e.clientX - rect.left
        const startY = e.clientY - rect.top
        setIsSelecting(true)
        setSelectionStart({ x: startX, y: startY })
        setSelectionBox({ x: startX, y: startY, width: 0, height: 0 })
      }
      return
    }
    
    // Check if clicking on board or board-canvas (not on a sticky note or UI element)
    const target = e.target as HTMLElement
    const stickyElement = target.closest('[data-testid="sticky-note"]')
    const clickedOnSticky = !!stickyElement
    const clickedOnUI = !!target.closest('[data-testid="trash-zone"]') || !!target.closest('button')
    
    // If clicking on a selected sticky without shift, start moving all selected stickies
    if (clickedOnSticky && e.button === 0 && !e.shiftKey) {
      const stickyId = stickyElement.id || ''
      if (selectedStickyIds.has(stickyId) && selectedStickyIds.size > 0) {
        e.preventDefault()
        setIsMovingSelection(true)
        
        // Store initial positions of all selected stickies
        const positions = new Map<string, { x: number; y: number }>()
        stickies.forEach(sticky => {
          if (selectedStickyIds.has(sticky.id)) {
            positions.set(sticky.id, { x: sticky.x, y: sticky.y })
          }
        })
        
        const rect = boardRef.current?.getBoundingClientRect()
        if (rect) {
          setMoveStart({
            x: (e.clientX - rect.left - position.x) / scale,
            y: (e.clientY - rect.top - position.y) / scale,
            positions
          })
        }
        return
      }
    }
    
    // Allow panning with left click on background (without shift)
    if (e.button === 0 && !clickedOnSticky && !clickedOnUI) {
      e.preventDefault()
      setIsPanning(true)
      setPanStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
    // Also allow middle button anywhere
    else if (e.button === 1) {
      e.preventDefault()
      setIsPanning(true)
      setPanStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    // Check if mouse has moved more than 5 pixels (threshold for drag detection)
    const distance = Math.sqrt(
      Math.pow(e.clientX - mouseDownPos.x, 2) + 
      Math.pow(e.clientY - mouseDownPos.y, 2)
    )
    if (distance > 5) {
      setHasDragged(true)
    }
    
    if (isPanning) {
      const newPos = {
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }
      const constrainedPos = constrainPosition(newPos, scale)
      setPosition(constrainedPos)
    } else if (isSelecting && boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect()
      const currentX = e.clientX - rect.left
      const currentY = e.clientY - rect.top
      
      // Calculate selection box
      const x = Math.min(selectionStart.x, currentX)
      const y = Math.min(selectionStart.y, currentY)
      const width = Math.abs(currentX - selectionStart.x)
      const height = Math.abs(currentY - selectionStart.y)
      
      setSelectionBox({ x, y, width, height })
      
      // Check which stickies are in the selection box
      const selectedIds = new Set<string>()
      stickies.forEach(sticky => {
        const stickySize = sticky.size || 1
        const stickyScreenX = sticky.x * scale + position.x
        const stickyScreenY = sticky.y * scale + position.y
        const stickyWidth = 192 * stickySize * scale // 48 * 4 (w-48 in tailwind is 12rem = 192px)
        const stickyHeight = 192 * stickySize * scale
        
        // Check if sticky intersects with selection box
        if (stickyScreenX + stickyWidth >= x &&
            stickyScreenX <= x + width &&
            stickyScreenY + stickyHeight >= y &&
            stickyScreenY <= y + height) {
          selectedIds.add(sticky.id)
        }
      })
      
      setSelectedStickyIds(selectedIds)
    } else if (isMovingSelection && moveStart && boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect()
      const currentX = (e.clientX - rect.left - position.x) / scale
      const currentY = (e.clientY - rect.top - position.y) / scale
      
      const deltaX = currentX - moveStart.x
      const deltaY = currentY - moveStart.y
      
      // Update positions of all selected stickies
      moveStart.positions.forEach((originalPos, stickyId) => {
        updateStickyPosition(stickyId, originalPos.x + deltaX, originalPos.y + deltaY)
      })
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
    setIsSelecting(false)
    setSelectionBox(null)
    setIsMovingSelection(false)
    setMoveStart(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const stickyId = e.dataTransfer.getData('stickyId')
    if (stickyId && boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect()
      const sticky = stickies.find(s => s.id === stickyId)
      const stickySize = sticky?.size || 1
      const halfWidth = (192 * stickySize) / 2
      const halfHeight = (192 * stickySize) / 2
      const x = (e.clientX - rect.left - position.x) / scale - halfWidth
      const y = (e.clientY - rect.top - position.y) / scale - halfHeight
      updateStickyPosition(stickyId, x, y)
    }
  }

  // Save view state to localStorage
  useEffect(() => {
    // Skip saving on initial mount
    const timeoutId = setTimeout(() => {
      const viewState = {
        scale,
        position
      }
      localStorage.setItem('board-view-state', JSON.stringify(viewState))
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }, [scale, position])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
      }
      
      // Handle delete/backspace for multiple selected notes
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedStickyIds.size > 0) {
        // Don't delete if the user is typing in a textarea or input
        const activeElement = document.activeElement
        if (activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')) {
          return
        }
        e.preventDefault()
        
        // Delete all selected sticky notes with animation
        const idsToDelete = Array.from(selectedStickyIds)
        handleDeleteWithAnimation(idsToDelete)
        setSelectedStickyIds(new Set())
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedStickyIds, handleDeleteWithAnimation])

  return (
    <div 
      ref={boardRef}
      data-testid="board"
      className={`w-full h-screen bg-gray-100 relative overflow-hidden ${
        isSelecting ? 'cursor-crosshair' : isPanning ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      onClick={handleBoardClick}
      onDoubleClick={handleBoardDoubleClick}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        data-testid="board-canvas"
        className="absolute"
        style={{
          width: `${canvasSize}px`,
          height: `${canvasSize}px`,
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: '0 0',
        }}
      >
        {stickies.map((sticky) => (
          <StickyNote
            key={sticky.id}
            id={sticky.id}
            x={sticky.x}
            y={sticky.y}
            text={sticky.text}
            color={sticky.color || 'yellow'}
            size={sticky.size || 1}
            fontSize={sticky.fontSize || 16}
            isBold={sticky.isBold}
            isItalic={sticky.isItalic}
            isUnderline={sticky.isUnderline}
            isSelected={selectedStickyIds.has(sticky.id)}
            hasMultipleSelection={selectedStickyIds.size > 1}
            isDeleting={deletingIds.has(sticky.id)}
            deletionType={deletionType}
            onSelect={(e?: React.MouseEvent) => {
              // If shift is not held, clear other selections
              if (!e || !e.shiftKey) {
                setSelectedStickyIds(new Set([sticky.id]))
              } else {
                // Toggle selection with shift held
                const newSelection = new Set(selectedStickyIds)
                if (newSelection.has(sticky.id)) {
                  newSelection.delete(sticky.id)
                } else {
                  newSelection.add(sticky.id)
                }
                setSelectedStickyIds(newSelection)
              }
            }}
            onTextChange={updateStickyText}
            onPositionChange={updateStickyPosition}
            onSizeChange={updateStickySize}
            onFontSizeChange={updateStickyFontSize}
            onFormatChange={updateStickyFormat}
            onDelete={(id) => handleDeleteWithAnimation([id], 'crumple')}
          />
        ))}
      </div>
      
      {/* Selection box */}
      {selectionBox && (
        <div
          className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-10 pointer-events-none"
          style={{
            left: `${selectionBox.x}px`,
            top: `${selectionBox.y}px`,
            width: `${selectionBox.width}px`,
            height: `${selectionBox.height}px`,
          }}
        />
      )}
      
      <AddStickyButton boardRef={boardRef} scale={scale} position={position} />
      
      {/* Top-right controls */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8 flex items-center gap-2 z-50">
        {/* Info button */}
        <InfoButton />
        
        {/* List view button */}
        <Link
          href="/list"
          className="px-4 py-2 bg-white text-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          <span className="text-sm font-medium">リスト表示</span>
        </Link>
      </div>
      
      <TrashZone 
        onDrop={(id) => {
          // Use peel animation for drag-to-trash
        handleDeleteWithAnimation([id], 'peel')
          // Remove from selection if it was selected
          const newSelection = new Set(selectedStickyIds)
          newSelection.delete(id)
          setSelectedStickyIds(newSelection)
        }} 
        onDeleteSelected={() => {
          if (selectedStickyIds.size > 0) {
            const idsToDelete = Array.from(selectedStickyIds)
            // Use crumple for bulk delete
            handleDeleteWithAnimation(idsToDelete, 'crumple')
            setSelectedStickyIds(new Set())
          }
        }}
      />
      
      {/* Zoom controls */}
      <ZoomControls 
        scale={scale}
        minScale={getMinScale()}
        maxScale={2.0}
        onScaleChange={(newScale) => {
          const rect = boardRef.current?.getBoundingClientRect()
          if (!rect) return
          
          // Use center of viewport as zoom origin
          const centerX = rect.width / 2
          const centerY = rect.height / 2
          
          // Calculate the point on canvas at center (before zoom)
          const canvasX = (centerX - position.x) / scale
          const canvasY = (centerY - position.y) / scale
          
          // Calculate new position to keep the same canvas point at center
          const newPos = {
            x: centerX - canvasX * newScale,
            y: centerY - canvasY * newScale
          }
          
          // Constrain position to keep canvas in view
          const constrainedPos = constrainPosition(newPos, newScale)
          
          setScale(newScale)
          setPosition(constrainedPos)
        }}
      />
    </div>
  )
}

export default function Board() {
  return (
    <Suspense fallback={null}>
      <BoardContent />
    </Suspense>
  )
}
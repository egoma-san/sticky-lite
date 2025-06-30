'use client'

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useStickiesWithUndo } from '../hooks/useStickiesWithUndo'
import StickyNote from './StickyNote'
import StickyFormatToolbar from './StickyFormatToolbar'
import TrashZone from './TrashZone'
import AddStickyButton from './AddStickyButton'
import ZoomControls from './ZoomControls'
import InfoButton from './InfoButton'
import { isModifierKeyPressed } from '../utils/platform'
import { playPaperSound } from '../utils/deletionSounds'
import { playOrigamiSound } from '../utils/origamiSounds'
import { useAuthStore } from '../../auth/store/useAuthStore'
import { useRouter } from 'next/navigation'
import { isSupabaseEnabled } from '@/app/lib/features'
import { StickyColor } from '../types'
import { useUndoStore } from '../store/useUndoStore'
import SnapshotButton from '../../snapshots/components/SnapshotButton'

function BoardContent() {
  const router = useRouter()
  const { logout, isAuthenticated, user } = useAuthStore()
  const searchParams = useSearchParams()
  const focusId = searchParams?.get('focus') || null
  const { stickies, addSticky, updateStickyText, updateStickyPosition, updateStickySize, updateStickyColor, updateStickyFontSize, updateStickyFormat, deleteSticky, deleteMultiple, restoreState } = useStickiesWithUndo()
  const { addToHistory, undo, redo, isUndoAvailable, isRedoAvailable } = useUndoStore()
  
  
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
  const [deletionType, setDeletionType] = useState<'crumple' | 'peel' | 'origami'>('origami')
  const [editingSticky, setEditingSticky] = useState<string | null>(null)
  const [activeEditor, setActiveEditor] = useState<HTMLDivElement | null>(null)
  const [stickyZIndices, setStickyZIndices] = useState<Map<string, number>>(new Map())
  const [highestZIndex, setHighestZIndex] = useState(0)
  const boardRef = useRef<HTMLDivElement>(null)
  const canvasSize = 10000 // Large canvas for open world
  const initialOffset = canvasSize / 2 // Center the view
  
  // Bring sticky to front by assigning highest z-index
  const bringToFront = useCallback((stickyId: string) => {
    const newZIndex = highestZIndex + 1
    setStickyZIndices(prev => new Map(prev).set(stickyId, newZIndex))
    setHighestZIndex(newZIndex)
  }, [highestZIndex])
  
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
    
    // Initialize undo history with current state
    if (stickies.length > 0) {
      addToHistory(stickies, 'Initial state')
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
  const handleDeleteWithAnimation = useCallback((ids: string[], type: 'crumple' | 'peel' | 'origami' = 'origami') => {
    // Set deletion type for animation
    setDeletionType(type)
    
    // Play appropriate sound
    if (type === 'origami') {
      playOrigamiSound(Math.random() > 0.5 ? 'crane' : 'plane')
    } else {
      playPaperSound(type)
    }
    
    // Add to deleting set
    setDeletingIds(new Set(ids))
    
    // Delete after animation
    const animationDuration = type === 'peel' ? 700 : type === 'origami' ? 900 : 500
    setTimeout(() => {
      if (ids.length === 1) {
        deleteSticky(ids[0])
      } else {
        deleteMultiple(ids)
      }
      setDeletingIds(new Set())
      setDeletionType('origami') // Reset to default
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
    
    // Check if clicking on a sticky note
    const target = e.target as HTMLElement
    const stickyElement = target.closest('[data-testid="sticky-note"]')
    const clickedOnSticky = !!stickyElement
    
    // Check if clicking on UI elements
    const clickedOnUI = !!target.closest('[data-testid="trash-zone"]') || !!target.closest('button')
    
    // Start selection box with shift+drag anywhere (including on sticky notes)
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
    
    // If clicking on a selected sticky without shift, start moving all selected stickies
    if (clickedOnSticky && e.button === 0 && !e.shiftKey) {
      const stickyId = stickyElement.id || ''
      if (selectedStickyIds.has(stickyId) && selectedStickyIds.size > 0) {
        e.preventDefault()
        setIsMovingSelection(true)
        
        // Bring all selected stickies to front
        selectedStickyIds.forEach(id => bringToFront(id))
        
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
      
      // Skip selection if box is too small
      if (width < 2 && height < 2) {
        setSelectedStickyIds(new Set())
        return
      }
      
      // Check which stickies are in the selection box
      const selectedIds = new Set<string>()
      stickies.forEach(sticky => {
        const stickySize = sticky.size || 1
        const stickyScreenX = sticky.x * scale + position.x
        const stickyScreenY = sticky.y * scale + position.y
        const stickyWidth = 192 * stickySize * scale
        const stickyHeight = 192 * stickySize * scale
        
        // Check if sticky intersects with selection box
        const intersects = !(stickyScreenX > x + width || 
                           stickyScreenX + stickyWidth < x || 
                           stickyScreenY > y + height || 
                           stickyScreenY + stickyHeight < y)
            
        if (intersects) {
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
      
      // Handle undo/redo shortcuts
      if (isModifierKeyPressed(e)) {
        // Cmd/Ctrl + Z for undo
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault()
          if (isUndoAvailable) {
            const previousState = undo()
            if (previousState) {
              restoreState(previousState)
            }
          }
          return
        }
        
        // Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y for redo
        if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault()
          if (isRedoAvailable) {
            const nextState = redo()
            if (nextState) {
              restoreState(nextState)
            }
          }
          return
        }
      }
      
      // Handle formatting shortcuts when sticky notes are selected (not in editing mode)
      if (selectedStickyIds.size > 0 && isModifierKeyPressed(e) && !editingSticky) {
        // Don't format if the user is typing in a textarea or input or contenteditable
        const activeElement = document.activeElement
        if (activeElement && (
          activeElement.tagName === 'TEXTAREA' || 
          activeElement.tagName === 'INPUT' ||
          activeElement.getAttribute('contenteditable') === 'true'
        )) {
          return
        }
        
        const selectedIds = Array.from(selectedStickyIds)
        
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault()
            // Toggle bold for all selected stickies
            const allBold = stickies
              .filter(s => selectedIds.includes(s.id))
              .every(s => s.isBold)
            selectedIds.forEach(id => updateStickyFormat(id, { isBold: !allBold }))
            break
            
          case 'i':
            e.preventDefault()
            // Toggle italic for all selected stickies
            const allItalic = stickies
              .filter(s => selectedIds.includes(s.id))
              .every(s => s.isItalic)
            selectedIds.forEach(id => updateStickyFormat(id, { isItalic: !allItalic }))
            break
            
          case 'u':
            e.preventDefault()
            // Toggle underline for all selected stickies
            const allUnderline = stickies
              .filter(s => selectedIds.includes(s.id))
              .every(s => s.isUnderline)
            selectedIds.forEach(id => updateStickyFormat(id, { isUnderline: !allUnderline }))
            break
        }
      }
      
      // Handle delete/backspace for multiple selected notes
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedStickyIds.size > 0 && !editingSticky) {
        // Don't delete if the user is typing in a textarea or input or contenteditable
        const activeElement = document.activeElement
        if (activeElement && (
          activeElement.tagName === 'TEXTAREA' || 
          activeElement.tagName === 'INPUT' ||
          activeElement.getAttribute('contenteditable') === 'true'
        )) {
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
  }, [selectedStickyIds, handleDeleteWithAnimation, stickies, updateStickyFormat, editingSticky, isUndoAvailable, isRedoAvailable, undo, redo, restoreState])

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
        {stickies.map((sticky) => {
          const isEditing = editingSticky === sticky.id
          return (
            <React.Fragment key={sticky.id}>
              <StickyNote
            id={sticky.id}
            x={sticky.x}
            y={sticky.y}
            text={sticky.text || ''}
            richText={sticky.richText}
            color={(sticky.color as any) || 'yellow'}
            size={sticky.size || 1}
            fontSize={sticky.fontSize || 16}
            isBold={sticky.isBold}
            isItalic={sticky.isItalic}
            isUnderline={sticky.isUnderline}
            isSelected={selectedStickyIds.has(sticky.id)}
            hasMultipleSelection={selectedStickyIds.size > 1}
            isDeleting={deletingIds.has(sticky.id)}
            deletionType={deletionType}
            zIndex={stickyZIndices.get(sticky.id) || 0}
            onSelect={(e?: React.MouseEvent) => {
              // If shift is not held, clear other selections
              if (!e || !e.shiftKey) {
                // Bring to front when selected (single selection)
                bringToFront(sticky.id)
                setSelectedStickyIds(new Set([sticky.id]))
              } else {
                // Toggle selection with shift held
                const newSelection = new Set(selectedStickyIds)
                if (newSelection.has(sticky.id)) {
                  newSelection.delete(sticky.id)
                } else {
                  newSelection.add(sticky.id)
                  // Only bring to front when adding to selection, not removing
                  bringToFront(sticky.id)
                }
                setSelectedStickyIds(newSelection)
              }
            }}
            onTextChange={updateStickyText}
            onPositionChange={updateStickyPosition}
            onSizeChange={updateStickySize}
            onColorChange={updateStickyColor}
            onFontSizeChange={updateStickyFontSize}
            onFormatChange={updateStickyFormat}
            onDelete={(id) => handleDeleteWithAnimation([id], 'origami')}
            onDragStart={() => bringToFront(sticky.id)}
            onEditingChange={(isEditing) => setEditingSticky(isEditing ? sticky.id : null)}
            onEditorRef={(ref) => setActiveEditor(ref)}
          />
            </React.Fragment>
          )
        })}
      </div>
      
      
      {/* Format toolbar - render outside of board canvas */}
      {(() => {
        // Don't show toolbar while selecting
        if (isSelecting) return null
        
        if (selectedStickyIds.size >= 1) {
          const selectedIds = Array.from(selectedStickyIds)
          const selectedStickies = stickies.filter(s => selectedIds.includes(s.id))
          
          if (selectedStickies.length === 0) return null
          
          // For multiple selection, use the first sticky's properties as reference
          const firstSticky = selectedStickies[0]
          
          // Calculate position for toolbar based on selection bounds
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
          
          selectedStickies.forEach(sticky => {
            const stickySize = sticky.size || 1
            const stickyScreenX = sticky.x * scale + position.x
            const stickyScreenY = sticky.y * scale + position.y
            const stickyWidth = 192 * stickySize * scale
            const stickyHeight = 192 * stickySize * scale
            
            minX = Math.min(minX, stickyScreenX)
            minY = Math.min(minY, stickyScreenY)
            maxX = Math.max(maxX, stickyScreenX + stickyWidth)
            maxY = Math.max(maxY, stickyScreenY + stickyHeight)
          })
          
          const centerX = (minX + maxX) / 2
          const toolbarWidth = maxX - minX
          const toolbarHeight = maxY - minY
          
          // Position toolbar above or below the selection
          const viewportHeight = window.innerHeight
          const spaceAbove = minY
          const toolbarPosition = spaceAbove > 100 ? 'top' : 'bottom'
          
          // Check if all selected stickies have the same format properties
          const allBold = selectedStickies.every(s => s.isBold)
          const allItalic = selectedStickies.every(s => s.isItalic)
          const allUnderline = selectedStickies.every(s => s.isUnderline)
          
          return (
            <StickyFormatToolbar
              color={firstSticky.color as StickyColor}
              fontSize={firstSticky.fontSize || 16}
              isBold={allBold}
              isItalic={allItalic}
              isUnderline={allUnderline}
              isEditing={!!editingSticky}
              activeEditor={activeEditor}
              onColorChange={(color) => {
                selectedIds.forEach(id => updateStickyColor(id, color))
              }}
              onFontSizeChange={(size) => {
                selectedIds.forEach(id => updateStickyFontSize(id, size))
              }}
              onFormatChange={(format) => {
                if (editingSticky && activeEditor) {
                  // In editing mode, apply format to selected text
                  if (format.isBold !== undefined) {
                    document.execCommand('bold', false)
                  }
                  if (format.isItalic !== undefined) {
                    document.execCommand('italic', false)
                  }
                  if (format.isUnderline !== undefined) {
                    document.execCommand('underline', false)
                  }
                  // Trigger input event to save changes
                  activeEditor.dispatchEvent(new Event('input', { bubbles: true }))
                } else {
                  // In selection mode, apply format to whole notes
                  selectedIds.forEach(id => updateStickyFormat(id, format))
                }
              }}
              position={toolbarPosition}
              x={centerX - toolbarWidth / 2}
              y={minY}
              width={toolbarWidth}
              height={toolbarHeight}
            />
          )
        }
        
        return null
      })()}
      
      {/* Selection box */}
      {selectionBox && (
        <div
          className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 pointer-events-none rounded-lg"
          style={{
            left: `${selectionBox.x}px`,
            top: `${selectionBox.y}px`,
            width: `${selectionBox.width}px`,
            height: `${selectionBox.height}px`,
          }}
        />
      )}
      
      <AddStickyButton boardRef={boardRef} scale={scale} position={position} />
      
      {/* Snapshot button */}
      <SnapshotButton />
      
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
        
        {/* Login/Logout button */}
        {isSupabaseEnabled() && (
          isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 hidden sm:inline">
                {user?.email}
              </span>
              <button
                onClick={() => {
                  const confirmLogout = window.confirm(
                    'ログアウトすると、クラウドの付箋にアクセスできなくなります。\nローカルには保存されません。\n\n本当にログアウトしますか？'
                  )
                  if (confirmLogout) {
                    logout()
                    // Don't redirect, just stay on the board
                  }
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:shadow-lg hover:bg-red-600 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-sm font-medium hidden sm:inline">ログアウト</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:shadow-lg hover:bg-blue-600 transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm font-medium hidden sm:inline">ログイン</span>
            </Link>
          )
        )}
      </div>
      
      <TrashZone 
        onDrop={(id) => {
          // Use origami animation for drag-to-trash
        handleDeleteWithAnimation([id], 'origami')
          // Remove from selection if it was selected
          const newSelection = new Set(selectedStickyIds)
          newSelection.delete(id)
          setSelectedStickyIds(newSelection)
        }} 
        onDeleteSelected={() => {
          if (selectedStickyIds.size > 0) {
            const idsToDelete = Array.from(selectedStickyIds)
            // Use origami for bulk delete
            handleDeleteWithAnimation(idsToDelete, 'origami')
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
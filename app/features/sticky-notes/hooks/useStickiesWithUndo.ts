import { useCallback } from 'react'
import { useStickies } from './useStickies'
import { useUndoStore } from '../store/useUndoStore'
import { useStickyStore } from '../store/useStickyStore'
import { StickyColor, Sticky } from '../types'

/**
 * Wrapper hook that adds undo/redo functionality to sticky operations
 */
export function useStickiesWithUndo() {
  const stickiesHook = useStickies()
  const { addToHistory } = useUndoStore()
  const localStore = useStickyStore()
  
  // Helper to save current state before making changes
  const saveStateBeforeChange = useCallback((description: string) => {
    // For local storage mode, we can directly access the current state
    addToHistory(stickiesHook.stickies, description)
  }, [stickiesHook.stickies, addToHistory])
  
  // Wrapped functions that save history before making changes
  const addSticky = useCallback(async (x: number, y: number, color?: StickyColor) => {
    saveStateBeforeChange('Add sticky note')
    return stickiesHook.addSticky(x, y, color)
  }, [stickiesHook, saveStateBeforeChange])
  
  const updateStickyText = useCallback(async (id: string, text: string, richText?: string) => {
    saveStateBeforeChange('Update text')
    return stickiesHook.updateStickyText(id, text, richText)
  }, [stickiesHook, saveStateBeforeChange])
  
  const updateStickyPosition = useCallback(async (id: string, x: number, y: number) => {
    saveStateBeforeChange('Move sticky')
    return stickiesHook.updateStickyPosition(id, x, y)
  }, [stickiesHook, saveStateBeforeChange])
  
  const updateStickySize = useCallback(async (id: string, size: number) => {
    saveStateBeforeChange('Resize sticky')
    return stickiesHook.updateStickySize(id, size)
  }, [stickiesHook, saveStateBeforeChange])
  
  const updateStickyColor = useCallback(async (id: string, color: StickyColor) => {
    saveStateBeforeChange('Change color')
    return stickiesHook.updateStickyColor(id, color)
  }, [stickiesHook, saveStateBeforeChange])
  
  const updateStickyFontSize = useCallback(async (id: string, fontSize: number) => {
    saveStateBeforeChange('Change font size')
    return stickiesHook.updateStickyFontSize(id, fontSize)
  }, [stickiesHook, saveStateBeforeChange])
  
  const updateStickyFormat = useCallback(async (id: string, format: { isBold?: boolean; isItalic?: boolean; isUnderline?: boolean }) => {
    saveStateBeforeChange('Change format')
    return stickiesHook.updateStickyFormat(id, format)
  }, [stickiesHook, saveStateBeforeChange])
  
  const deleteSticky = useCallback(async (id: string) => {
    saveStateBeforeChange('Delete sticky')
    return stickiesHook.deleteSticky(id)
  }, [stickiesHook, saveStateBeforeChange])
  
  const deleteMultiple = useCallback(async (ids: string[]) => {
    saveStateBeforeChange(`Delete ${ids.length} stickies`)
    return stickiesHook.deleteMultiple(ids)
  }, [stickiesHook, saveStateBeforeChange])
  
  // Function to restore state from undo/redo
  const restoreState = useCallback((stickies: Sticky[]) => {
    // For local storage mode, directly update the store
    if (!stickiesHook.isLoading) {
      localStore.restoreState(stickies)
    }
    // For Supabase mode, we would need to sync with the server
    // This is more complex and would require batch updates
  }, [stickiesHook.isLoading, localStore])
  
  return {
    ...stickiesHook,
    addSticky,
    updateStickyText,
    updateStickyPosition,
    updateStickySize,
    updateStickyColor,
    updateStickyFontSize,
    updateStickyFormat,
    deleteSticky,
    deleteMultiple,
    restoreState
  }
}
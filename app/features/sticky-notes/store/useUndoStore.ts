import { create } from 'zustand'
import { Sticky } from '../types'

interface HistoryEntry {
  timestamp: number
  stickies: Sticky[]
  description?: string
}

interface UndoStore {
  history: HistoryEntry[]
  currentIndex: number
  maxHistorySize: number
  isUndoAvailable: boolean
  isRedoAvailable: boolean
  
  // Add a new state to history
  addToHistory: (stickies: Sticky[], description?: string) => void
  
  // Undo the last action
  undo: () => Sticky[] | null
  
  // Redo the previously undone action
  redo: () => Sticky[] | null
  
  // Clear history
  clearHistory: () => void
}

export const useUndoStore = create<UndoStore>((set, get) => ({
  history: [],
  currentIndex: -1,
  maxHistorySize: 6, // Keep 6 entries: current state + 5 previous states
  isUndoAvailable: false,
  isRedoAvailable: false,
  
  addToHistory: (stickies, description) => {
    const { history, currentIndex, maxHistorySize } = get()
    
    // Create deep copy of stickies to avoid reference issues
    const stickySnapshot = JSON.parse(JSON.stringify(stickies))
    
    const newEntry: HistoryEntry = {
      timestamp: Date.now(),
      stickies: stickySnapshot,
      description
    }
    
    // Remove any entries after current index (when adding new entry after undo)
    const newHistory = history.slice(0, currentIndex + 1)
    
    // Add new entry
    newHistory.push(newEntry)
    
    // Keep only the last maxHistorySize entries
    if (newHistory.length > maxHistorySize) {
      newHistory.shift()
    }
    
    const newIndex = newHistory.length - 1
    
    set({
      history: newHistory,
      currentIndex: newIndex,
      isUndoAvailable: newIndex > 0,
      isRedoAvailable: false
    })
  },
  
  undo: () => {
    const { history, currentIndex } = get()
    
    if (currentIndex <= 0) return null
    
    const newIndex = currentIndex - 1
    const previousState = history[newIndex]
    
    set({
      currentIndex: newIndex,
      isUndoAvailable: newIndex > 0,
      isRedoAvailable: true
    })
    
    // Return deep copy to avoid mutations
    return JSON.parse(JSON.stringify(previousState.stickies))
  },
  
  redo: () => {
    const { history, currentIndex } = get()
    
    if (currentIndex >= history.length - 1) return null
    
    const newIndex = currentIndex + 1
    const nextState = history[newIndex]
    
    set({
      currentIndex: newIndex,
      isUndoAvailable: true,
      isRedoAvailable: newIndex < history.length - 1
    })
    
    // Return deep copy to avoid mutations
    return JSON.parse(JSON.stringify(nextState.stickies))
  },
  
  clearHistory: () => {
    set({
      history: [],
      currentIndex: -1,
      isUndoAvailable: false,
      isRedoAvailable: false
    })
  }
}))
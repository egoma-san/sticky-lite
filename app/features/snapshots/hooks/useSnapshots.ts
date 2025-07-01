import { useEffect } from 'react'
import { useAuthStore } from '@/app/features/auth/store/useAuthStore'
import { useLocalSnapshotStore } from '../store/useLocalSnapshotStore'
import { useSupabaseSnapshotStore } from '../store/useSupabaseSnapshotStore'
import { useStickies } from '@/app/features/sticky-notes/hooks/useStickies'
import { SnapshotSticky } from '../types'
import { StickyColor } from '@/app/features/sticky-notes/types'

/**
 * Unified hook for snapshot functionality
 * Switches between local and Supabase storage based on authentication
 */
export function useSnapshots() {
  const { isAuthenticated } = useAuthStore()
  const { stickies } = useStickies()
  const localStore = useLocalSnapshotStore()
  const supabaseStore = useSupabaseSnapshotStore()
  
  // Use appropriate store based on authentication
  const store = isAuthenticated ? supabaseStore : localStore
  
  // Fetch snapshots when authentication changes
  useEffect(() => {
    store.fetchSnapshots()
  }, [isAuthenticated])
  
  // Helper to get current stickies in snapshot format
  const getCurrentStickies = (): SnapshotSticky[] => {
    console.log('getCurrentStickies: input stickies:', stickies)
    const result = stickies.map(sticky => ({
      id: sticky.id,
      x: sticky.x,
      y: sticky.y,
      text: sticky.text || '',
      richText: sticky.richText || undefined,
      color: sticky.color as StickyColor,
      size: sticky.size || 1,
      fontSize: sticky.fontSize || 16,
      isBold: sticky.isBold || false,
      isItalic: sticky.isItalic || false,
      isUnderline: sticky.isUnderline || false
    }))
    console.log('getCurrentStickies: output:', result)
    return result
  }
  
  // Save current state as snapshot
  const saveCurrentAsSnapshot = async (name: string, description?: string) => {
    const currentStickies = getCurrentStickies()
    console.log('useSnapshots: Saving snapshot with stickies:', currentStickies)
    await store.saveSnapshot(name, description, currentStickies)
  }
  
  return {
    snapshots: store.snapshots,
    isLoading: store.isLoading,
    error: store.error,
    maxSnapshots: store.maxSnapshots,
    canSaveMore: store.snapshots.length < store.maxSnapshots,
    
    saveSnapshot: saveCurrentAsSnapshot,
    loadSnapshot: store.loadSnapshot,
    deleteSnapshot: store.deleteSnapshot,
    refreshSnapshots: store.fetchSnapshots,
    clearError: store.clearError
  }
}
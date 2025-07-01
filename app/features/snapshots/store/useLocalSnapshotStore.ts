import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Snapshot, SnapshotStore, SnapshotSticky } from '../types'
import { sanitizeStickies, sanitizeSnapshotMetadata } from '../utils/sanitizer'

interface LocalSnapshotStore extends SnapshotStore {
  snapshot: Snapshot | null
}

export const useLocalSnapshotStore = create<LocalSnapshotStore>()(
  persist(
    (set, get) => ({
      snapshots: [],
      snapshot: null,
      isLoading: false,
      error: null,
      maxSnapshots: 1,
      
      saveSnapshot: async (name: string, description?: string, stickies?: SnapshotSticky[]) => {
        try {
          console.log('LocalSnapshotStore: saveSnapshot called with:', { name, description, stickiesCount: stickies?.length })
          set({ isLoading: true, error: null })
          
          // Sanitize input
          const { name: sanitizedName, description: sanitizedDesc } = sanitizeSnapshotMetadata(name, description)
          const sanitizedStickies = stickies ? sanitizeStickies(stickies) : []
          
          console.log('LocalSnapshotStore: Sanitized stickies count:', sanitizedStickies.length)
          
          // Create new snapshot
          const newSnapshot: Snapshot = {
            id: Date.now().toString(),
            name: sanitizedName,
            description: sanitizedDesc,
            stickies: sanitizedStickies,
            createdAt: new Date()
          }
          
          console.log('LocalSnapshotStore: Created snapshot:', newSnapshot)
          
          // For local storage, we only keep one snapshot (overwrite existing)
          set({ 
            snapshot: newSnapshot,
            snapshots: [newSnapshot],
            isLoading: false 
          })
          
          console.log('LocalSnapshotStore: State updated successfully')
          
          // Show confirmation if overwriting
          const { snapshot: prevSnapshot } = get()
          if (prevSnapshot && prevSnapshot.id !== newSnapshot.id) {
            console.log('LocalSnapshotStore: Overwritten previous snapshot')
          }
        } catch (error) {
          console.error('LocalSnapshotStore: Error saving snapshot:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to save snapshot',
            isLoading: false 
          })
          throw error
        }
      },
      
      loadSnapshot: async (snapshotId: string) => {
        try {
          const { snapshot } = get()
          
          if (!snapshot || snapshot.id !== snapshotId) {
            throw new Error('Snapshot not found')
          }
          
          // Return sanitized stickies
          return sanitizeStickies(snapshot.stickies)
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load snapshot'
          })
          return null
        }
      },
      
      deleteSnapshot: async (snapshotId: string) => {
        try {
          const { snapshot } = get()
          
          if (snapshot && snapshot.id === snapshotId) {
            set({ 
              snapshot: null,
              snapshots: []
            })
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete snapshot'
          })
        }
      },
      
      fetchSnapshots: async () => {
        // For local storage, snapshots are already loaded
        const { snapshot } = get()
        set({ 
          snapshots: snapshot ? [snapshot] : []
        })
      },
      
      clearError: () => set({ error: null })
    }),
    {
      name: 'local-snapshot-storage',
      version: 1,
      partialize: (state) => ({ 
        snapshot: state.snapshot 
      })
    }
  )
)
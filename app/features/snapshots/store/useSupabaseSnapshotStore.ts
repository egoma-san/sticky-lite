import { create } from 'zustand'
import { createClient } from '@/app/lib/supabase/client'
import { Snapshot, SnapshotStore, SnapshotSticky } from '../types'
import { sanitizeStickies, sanitizeSnapshotMetadata } from '../utils/sanitizer'

export const useSupabaseSnapshotStore = create<SnapshotStore>((set, get) => ({
  snapshots: [],
  isLoading: false,
  error: null,
  maxSnapshots: 5,
  
  saveSnapshot: async (name: string, description?: string, stickies?: SnapshotSticky[]) => {
    try {
      set({ isLoading: true, error: null })
      
      const supabase = createClient()
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('Not authenticated')
      
      // Get current board from board store
      const { useBoardStore } = await import('@/app/features/boards/store/useBoardStore')
      const currentBoard = useBoardStore.getState().currentBoard
      if (!currentBoard) throw new Error('No board selected')
      const boardId = currentBoard.id
      
      // Sanitize input
      const { name: sanitizedName, description: sanitizedDesc } = sanitizeSnapshotMetadata(name, description)
      const sanitizedStickies = stickies ? sanitizeStickies(stickies) : []
      
      // Check if user has reached the limit
      const { count, error: countError } = await supabase
        .from('snapshots')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('board_id', boardId)
      
      if (countError) throw countError
      
      if (count && count >= 5) {
        throw new Error('Maximum of 5 snapshots per board allowed')
      }
      
      // Create snapshot
      const { data, error } = await supabase
        .from('snapshots')
        .insert({
          user_id: user.id,
          board_id: boardId,
          name: sanitizedName,
          description: sanitizedDesc,
          snapshot_data: { stickies: sanitizedStickies }
        })
        .select()
        .single()
      
      if (error) throw error
      
      // Update local state
      const newSnapshot: Snapshot = {
        id: data.id,
        name: data.name,
        description: data.description,
        stickies: sanitizedStickies,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }
      
      set(state => ({
        snapshots: [...state.snapshots, newSnapshot],
        isLoading: false
      }))
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to save snapshot',
        isLoading: false 
      })
    }
  },
  
  loadSnapshot: async (snapshotId: string) => {
    try {
      set({ isLoading: true, error: null })
      
      const supabase = createClient()
      
      // Get snapshot from database
      const { data, error } = await supabase
        .from('snapshots')
        .select('snapshot_data')
        .eq('id', snapshotId)
        .single()
      
      if (error) throw error
      if (!data || !data.snapshot_data) throw new Error('Snapshot not found')
      
      // Sanitize and return stickies
      const stickies = data.snapshot_data.stickies || []
      const sanitized = sanitizeStickies(stickies)
      
      set({ isLoading: false })
      return sanitized
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load snapshot',
        isLoading: false 
      })
      return null
    }
  },
  
  deleteSnapshot: async (snapshotId: string) => {
    try {
      set({ isLoading: true, error: null })
      
      const supabase = createClient()
      
      // Delete from database
      const { error } = await supabase
        .from('snapshots')
        .delete()
        .eq('id', snapshotId)
      
      if (error) throw error
      
      // Update local state
      set(state => ({
        snapshots: state.snapshots.filter(s => s.id !== snapshotId),
        isLoading: false
      }))
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete snapshot',
        isLoading: false 
      })
    }
  },
  
  fetchSnapshots: async () => {
    try {
      set({ isLoading: true, error: null })
      
      const supabase = createClient()
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('Not authenticated')
      
      // Get current board from board store
      const { useBoardStore } = await import('@/app/features/boards/store/useBoardStore')
      const currentBoard = useBoardStore.getState().currentBoard
      if (!currentBoard) throw new Error('No board selected')
      const boardId = currentBoard.id
      
      // Fetch snapshots
      const { data, error } = await supabase
        .from('snapshots')
        .select('*')
        .eq('user_id', user.id)
        .eq('board_id', boardId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // Convert to local format
      const snapshots: Snapshot[] = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        stickies: sanitizeStickies(item.snapshot_data?.stickies || []),
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }))
      
      set({ snapshots, isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch snapshots',
        isLoading: false 
      })
    }
  },
  
  clearError: () => set({ error: null })
}))
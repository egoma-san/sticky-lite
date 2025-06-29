import { create } from 'zustand'
import { createClient } from '@/app/lib/supabase/client'
import { useBoardStore } from '@/app/features/boards/store/useBoardStore'
import type { Database } from '@/types/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

type StickyDB = Database['public']['Tables']['stickies']['Row']
type StickyInsert = Database['public']['Tables']['stickies']['Insert']
type StickyUpdate = Database['public']['Tables']['stickies']['Update']

export type StickyColor = 'yellow' | 'blue' | 'pink' | 'green' | 'purple' | 'orange'

export interface Sticky extends Omit<StickyDB, 'created_at' | 'updated_at'> {
  createdAt: Date
  updatedAt?: Date
}

interface StickyStore {
  stickies: Sticky[]
  selectedColor: StickyColor
  isLoading: boolean
  error: string | null
  channel: RealtimeChannel | null
  
  // Actions
  setSelectedColor: (color: StickyColor) => void
  fetchStickies: (boardId: string) => Promise<void>
  addSticky: (x: number, y: number, color?: StickyColor) => Promise<void>
  updateStickyText: (id: string, text: string, richText?: string) => Promise<void>
  updateStickyPosition: (id: string, x: number, y: number) => Promise<void>
  updateStickySize: (id: string, size: number) => Promise<void>
  updateStickyFontSize: (id: string, fontSize: number) => Promise<void>
  updateStickyFormat: (id: string, format: { is_bold?: boolean; is_italic?: boolean; is_underline?: boolean }) => Promise<void>
  deleteSticky: (id: string) => Promise<void>
  deleteMultiple: (ids: string[]) => Promise<void>
  clearAll: () => Promise<void>
  subscribeToBoard: (boardId: string) => void
  unsubscribeFromBoard: () => void
  clearError: () => void
}

const supabase = createClient()

export const useSupabaseStickyStore = create<StickyStore>()((set, get) => ({
  stickies: [],
  selectedColor: 'yellow' as StickyColor,
  isLoading: false,
  error: null,
  channel: null,

  setSelectedColor: (color) => set({ selectedColor: color }),

  fetchStickies: async (boardId: string) => {
    if (!supabase) {
      set({ stickies: [], isLoading: false })
      return
    }
    
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('stickies')
        .select('*')
        .eq('board_id', boardId)
        .order('created_at', { ascending: true })

      if (error) throw error

      const stickies: Sticky[] = (data || []).map(sticky => ({
        ...sticky,
        createdAt: new Date(sticky.created_at),
        updatedAt: sticky.updated_at ? new Date(sticky.updated_at) : undefined
      }))

      set({ stickies, isLoading: false })
    } catch (error) {
      set({ error: 'Failed to fetch stickies', isLoading: false })
    }
  },

  addSticky: async (x: number, y: number, color?: StickyColor) => {
    const currentBoard = useBoardStore.getState().currentBoard
    if (!currentBoard) return

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return

    const selectedColor = color || get().selectedColor

    try {
      const newSticky: StickyInsert = {
        board_id: currentBoard.id,
        user_id: user.user.id,
        x,
        y,
        text: '',
        color: selectedColor,
        size: 1,
        font_size: 16,
        is_bold: false,
        is_italic: false,
        is_underline: false
      }

      const { data, error } = await supabase
        .from('stickies')
        .insert(newSticky)
        .select()
        .single()

      if (error) throw error

      const sticky: Sticky = {
        ...data,
        createdAt: new Date(data.created_at),
        updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
      }

      set((state) => ({ stickies: [...state.stickies, sticky] }))
    } catch (error) {
      set({ error: 'Failed to add sticky' })
    }
  },

  updateStickyText: async (id: string, text: string, richText?: string) => {
    try {
      const { error } = await supabase
        .from('stickies')
        .update({ text, rich_text: richText })
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        stickies: state.stickies.map(sticky =>
          sticky.id === id ? { ...sticky, text, rich_text: richText || null } : sticky
        )
      }))
    } catch (error) {
      set({ error: 'Failed to update sticky text' })
    }
  },

  updateStickyPosition: async (id: string, x: number, y: number) => {
    try {
      const { error } = await supabase
        .from('stickies')
        .update({ x, y })
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        stickies: state.stickies.map(sticky =>
          sticky.id === id ? { ...sticky, x, y } : sticky
        )
      }))
    } catch (error) {
      set({ error: 'Failed to update sticky position' })
    }
  },

  updateStickySize: async (id: string, size: number) => {
    try {
      const { error } = await supabase
        .from('stickies')
        .update({ size })
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        stickies: state.stickies.map(sticky =>
          sticky.id === id ? { ...sticky, size } : sticky
        )
      }))
    } catch (error) {
      set({ error: 'Failed to update sticky size' })
    }
  },

  updateStickyFontSize: async (id: string, fontSize: number) => {
    try {
      const { error } = await supabase
        .from('stickies')
        .update({ font_size: fontSize })
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        stickies: state.stickies.map(sticky =>
          sticky.id === id ? { ...sticky, font_size: fontSize } : sticky
        )
      }))
    } catch (error) {
      set({ error: 'Failed to update sticky font size' })
    }
  },

  updateStickyFormat: async (id: string, format: { is_bold?: boolean; is_italic?: boolean; is_underline?: boolean }) => {
    try {
      const { error } = await supabase
        .from('stickies')
        .update(format)
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        stickies: state.stickies.map(sticky =>
          sticky.id === id ? { ...sticky, ...format } : sticky
        )
      }))
    } catch (error) {
      set({ error: 'Failed to update sticky format' })
    }
  },

  deleteSticky: async (id: string) => {
    try {
      const { error } = await supabase
        .from('stickies')
        .delete()
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        stickies: state.stickies.filter(sticky => sticky.id !== id)
      }))
    } catch (error) {
      set({ error: 'Failed to delete sticky' })
    }
  },

  deleteMultiple: async (ids: string[]) => {
    try {
      const { error } = await supabase
        .from('stickies')
        .delete()
        .in('id', ids)

      if (error) throw error

      set((state) => ({
        stickies: state.stickies.filter(sticky => !ids.includes(sticky.id))
      }))
    } catch (error) {
      set({ error: 'Failed to delete stickies' })
    }
  },

  clearAll: async () => {
    const currentBoard = useBoardStore.getState().currentBoard
    if (!currentBoard) return

    try {
      const { error } = await supabase
        .from('stickies')
        .delete()
        .eq('board_id', currentBoard.id)

      if (error) throw error

      set({ stickies: [] })
    } catch (error) {
      set({ error: 'Failed to clear all stickies' })
    }
  },

  subscribeToBoard: (boardId: string) => {
    // 既存のチャンネルをクリーンアップ
    get().unsubscribeFromBoard()

    const channel = supabase
      .channel(`board-${boardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stickies',
          filter: `board_id=eq.${boardId}`
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload

          if (eventType === 'INSERT' && newRecord) {
            const sticky: Sticky = {
              ...newRecord as StickyDB,
              createdAt: new Date(newRecord.created_at),
              updatedAt: newRecord.updated_at ? new Date(newRecord.updated_at) : undefined
            }
            set((state) => ({
              stickies: [...state.stickies, sticky]
            }))
          } else if (eventType === 'UPDATE' && newRecord) {
            set((state) => ({
              stickies: state.stickies.map(sticky =>
                sticky.id === newRecord.id
                  ? {
                      ...newRecord as StickyDB,
                      createdAt: sticky.createdAt,
                      updatedAt: new Date()
                    }
                  : sticky
              )
            }))
          } else if (eventType === 'DELETE' && oldRecord) {
            set((state) => ({
              stickies: state.stickies.filter(sticky => sticky.id !== oldRecord.id)
            }))
          }
        }
      )
      .subscribe()

    set({ channel })
  },

  unsubscribeFromBoard: () => {
    const channel = get().channel
    if (channel) {
      supabase.removeChannel(channel)
      set({ channel: null })
    }
  },

  clearError: () => set({ error: null })
}))
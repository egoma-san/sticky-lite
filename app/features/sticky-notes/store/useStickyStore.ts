import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Sticky, StickyStore, StickyColor } from '../types'

export const useStickyStore = create<StickyStore>()(
  persist(
    (set) => ({
      stickies: [],
      selectedColor: 'yellow' as StickyColor,
      
      setSelectedColor: (color) => set({ selectedColor: color }),
      
      addSticky: (x, y, color) => set((state) => ({
        stickies: [...state.stickies, {
          id: typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function'
            ? crypto.randomUUID() 
            : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
          x,
          y,
          text: '',
          color: color || state.selectedColor,
          createdAt: new Date()
        }]
      })),
      
      updateStickyText: (id, text, richText) => set((state) => ({
        stickies: state.stickies.map(sticky =>
          sticky.id === id ? { ...sticky, text, richText } : sticky
        )
      })),
      
      updateStickyPosition: (id, x, y) => set((state) => ({
        stickies: state.stickies.map(sticky =>
          sticky.id === id ? { ...sticky, x, y } : sticky
        )
      })),
      
      updateStickySize: (id, size) => set((state) => ({
        stickies: state.stickies.map(sticky =>
          sticky.id === id ? { ...sticky, size } : sticky
        )
      })),
      
      updateStickyColor: (id, color) => set((state) => ({
        stickies: state.stickies.map(sticky =>
          sticky.id === id ? { ...sticky, color } : sticky
        )
      })),
      
      updateStickyFontSize: (id, fontSize) => set((state) => ({
        stickies: state.stickies.map(sticky =>
          sticky.id === id ? { ...sticky, fontSize } : sticky
        )
      })),
      
      updateStickyFormat: (id, format) => set((state) => ({
        stickies: state.stickies.map(sticky =>
          sticky.id === id ? { ...sticky, ...format } : sticky
        )
      })),
      
      deleteSticky: (id) => set((state) => ({
        stickies: state.stickies.filter(sticky => sticky.id !== id)
      })),
      
      deleteMultiple: (ids) => set((state) => ({
        stickies: state.stickies.filter(sticky => !ids.includes(sticky.id))
      })),
      
      clearAll: () => set({ stickies: [] })
    }),
    {
      name: 'sticky-storage',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migrate old stickies without color and size properties
          return {
            ...persistedState,
            stickies: persistedState.stickies?.map((sticky: any) => ({
              ...sticky,
              color: sticky.color || 'yellow',
              size: sticky.size || 1,
              fontSize: sticky.fontSize || 16
            })) || [],
            selectedColor: persistedState.selectedColor || 'yellow'
          }
        }
        return persistedState
      }
    }
  )
)
import { useEffect } from 'react'
import { useStickyStore } from '../store/useStickyStore'
import { useSupabaseStickyStore } from '../store/useSupabaseStickyStore'
import { useAuthStore } from '@/app/features/auth/store/useAuthStore'
import { useBoardStore } from '@/app/features/boards/store/useBoardStore'

/**
 * This hook provides a unified interface for sticky notes
 * It switches between local storage and Supabase based on authentication status
 */
export function useStickies() {
  const { isAuthenticated } = useAuthStore()
  const { currentBoard } = useBoardStore()
  
  // Local store (for non-authenticated users)
  const localStore = useStickyStore()
  
  // Supabase store (for authenticated users)
  const supabaseStore = useSupabaseStickyStore()

  // Fetch stickies when board changes
  useEffect(() => {
    if (isAuthenticated && currentBoard) {
      supabaseStore.fetchStickies(currentBoard.id)
      supabaseStore.subscribeToBoard(currentBoard.id)
      
      return () => {
        supabaseStore.unsubscribeFromBoard()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  // Return appropriate store based on authentication
  if (isAuthenticated && currentBoard) {
    // Transform Supabase stickies to match local store format
    const transformedStickies = supabaseStore.stickies.map(sticky => ({
      ...sticky,
      richText: (sticky as any).rich_text,
      fontSize: (sticky as any).font_size,
      isBold: (sticky as any).is_bold,
      isItalic: (sticky as any).is_italic,
      isUnderline: (sticky as any).is_underline,
    }))
    
    return {
      stickies: transformedStickies,
      selectedColor: supabaseStore.selectedColor,
      isLoading: supabaseStore.isLoading,
      error: supabaseStore.error,
      setSelectedColor: supabaseStore.setSelectedColor,
      addSticky: supabaseStore.addSticky,
      updateStickyText: supabaseStore.updateStickyText,
      updateStickyPosition: supabaseStore.updateStickyPosition,
      updateStickySize: supabaseStore.updateStickySize,
      updateStickyFontSize: supabaseStore.updateStickyFontSize,
      updateStickyFormat: (id: string, format: { isBold?: boolean; isItalic?: boolean; isUnderline?: boolean }) => {
        return supabaseStore.updateStickyFormat(id, {
          is_bold: format.isBold,
          is_italic: format.isItalic,
          is_underline: format.isUnderline
        })
      },
      deleteSticky: supabaseStore.deleteSticky,
      deleteMultiple: supabaseStore.deleteMultiple,
      clearAll: supabaseStore.clearAll,
      clearError: supabaseStore.clearError
    }
  }

  // Use local store for non-authenticated users
  return {
    stickies: localStore.stickies,
    selectedColor: localStore.selectedColor,
    isLoading: false,
    error: null,
    setSelectedColor: localStore.setSelectedColor,
    addSticky: (x: number, y: number, color?: any) => {
      localStore.addSticky(x, y, color)
      return Promise.resolve()
    },
    updateStickyText: (id: string, text: string, richText?: string) => {
      localStore.updateStickyText(id, text, richText)
      return Promise.resolve()
    },
    updateStickyPosition: (id: string, x: number, y: number) => {
      localStore.updateStickyPosition(id, x, y)
      return Promise.resolve()
    },
    updateStickySize: (id: string, size: number) => {
      localStore.updateStickySize(id, size)
      return Promise.resolve()
    },
    updateStickyFontSize: (id: string, fontSize: number) => {
      localStore.updateStickyFontSize(id, fontSize)
      return Promise.resolve()
    },
    updateStickyFormat: (id: string, format: any) => {
      localStore.updateStickyFormat(id, format)
      return Promise.resolve()
    },
    deleteSticky: (id: string) => {
      localStore.deleteSticky(id)
      return Promise.resolve()
    },
    deleteMultiple: (ids: string[]) => {
      localStore.deleteMultiple(ids)
      return Promise.resolve()
    },
    clearAll: () => {
      localStore.clearAll()
      return Promise.resolve()
    },
    clearError: () => {}
  }
}
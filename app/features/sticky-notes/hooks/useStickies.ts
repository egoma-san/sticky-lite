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
  const { isAuthenticated, user } = useAuthStore()
  const { currentBoard, setCurrentBoard, createBoard, fetchBoards } = useBoardStore()
  
  // Local store (for non-authenticated users)
  const localStore = useStickyStore()
  
  // Supabase store (for authenticated users)
  const supabaseStore = useSupabaseStickyStore()

  // Create default board for authenticated users and merge local data
  useEffect(() => {
    const initializeBoard = async () => {
      if (isAuthenticated && user && !currentBoard) {
        // Fetch user's boards
        await fetchBoards()
        
        // Get the updated state
        const boards = useBoardStore.getState().boards
        
        let targetBoard = null
        
        if (boards.length === 0) {
          // Create a default board if user has none
          const newBoard = await createBoard(`${user.email}'s Board`)
          if (newBoard) {
            targetBoard = newBoard
            setCurrentBoard(newBoard)
          }
        } else {
          // Use the first board as current
          targetBoard = boards[0]
          setCurrentBoard(boards[0])
        }
        
        // Merge local stickies to cloud if there are any
        if (targetBoard && localStore.stickies.length > 0) {
          const localStickies = localStore.stickies
          
          // Show confirmation dialog
          const shouldMerge = window.confirm(
            `ローカルに${localStickies.length}個の付箋があります。\nクラウドにアップロードしますか？\n\n「OK」: ローカルの付箋をクラウドに追加\n「キャンセル」: ローカルの付箋を破棄`
          )
          
          if (shouldMerge) {
            // Wait for cloud stickies to be loaded
            await supabaseStore.fetchStickies(targetBoard.id)
            const cloudStickies = supabaseStore.stickies
            
            // Check for duplicates based on position and content
            const isDuplicate = (localSticky: any) => {
              return cloudStickies.some(cloudSticky => 
                Math.abs(cloudSticky.x - localSticky.x) < 5 && // Allow 5px tolerance
                Math.abs(cloudSticky.y - localSticky.y) < 5 &&
                cloudSticky.text === localSticky.text &&
                cloudSticky.color === localSticky.color &&
                (cloudSticky as any).size === (localSticky.size || 1)
              )
            }
            
            // Filter out duplicates
            const uniqueStickies = localStickies.filter(sticky => !isDuplicate(sticky))
            
            if (uniqueStickies.length === 0) {
              window.alert('すべての付箋は既にクラウドに存在します')
            } else {
              // Upload only unique stickies
              for (const sticky of uniqueStickies) {
                await supabaseStore.addSticky(sticky.x, sticky.y, sticky.color)
                const newStickies = supabaseStore.stickies
                const newSticky = newStickies[newStickies.length - 1]
                
                if (newSticky && sticky.text) {
                  await supabaseStore.updateStickyText(newSticky.id, sticky.text, sticky.richText)
                }
                if (newSticky && sticky.size && sticky.size !== 1) {
                  await supabaseStore.updateStickySize(newSticky.id, sticky.size)
                }
                if (newSticky && sticky.fontSize && sticky.fontSize !== 16) {
                  await supabaseStore.updateStickyFontSize(newSticky.id, sticky.fontSize)
                }
                if (newSticky && (sticky.isBold || sticky.isItalic || sticky.isUnderline)) {
                  await supabaseStore.updateStickyFormat(newSticky.id, {
                    is_bold: sticky.isBold,
                    is_italic: sticky.isItalic,
                    is_underline: sticky.isUnderline
                  })
                }
              }
              
              const duplicateCount = localStickies.length - uniqueStickies.length
              const message = duplicateCount > 0 
                ? `${uniqueStickies.length}個の付箋をクラウドにアップロードしました（${duplicateCount}個は重複のためスキップ）`
                : `${uniqueStickies.length}個の付箋をクラウドにアップロードしました`
              window.alert(message)
            }
            
            // Clear local storage after successful merge
            localStore.clearAll()
          } else {
            // User chose to discard local stickies
            localStore.clearAll()
          }
        }
      }
    }
    
    initializeBoard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user])

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
  }, [isAuthenticated, currentBoard])

  // Return appropriate store based on authentication
  if (isAuthenticated && currentBoard) {
    // Supabase stickies are already in the correct format after transformation in useSupabaseStickyStore
    const transformedStickies = supabaseStore.stickies
    
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
      updateStickyColor: supabaseStore.updateStickyColor,
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
      clearError: supabaseStore.clearError,
      restoreState: supabaseStore.restoreState
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
    updateStickyColor: (id: string, color: any) => {
      localStore.updateStickyColor(id, color)
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
    clearError: () => {},
    restoreState: localStore.restoreState
  }
}
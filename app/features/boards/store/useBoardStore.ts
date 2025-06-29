import { create } from 'zustand'
import { createClient } from '@/app/lib/supabase/client'
import type { Database } from '@/types/supabase'

type Board = Database['public']['Tables']['boards']['Row']
type BoardMember = Database['public']['Tables']['board_members']['Row']

interface BoardState {
  boards: Board[]
  currentBoard: Board | null
  members: BoardMember[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchBoards: () => Promise<void>
  fetchBoardMembers: (boardId: string) => Promise<void>
  createBoard: (name: string) => Promise<Board | null>
  deleteBoard: (boardId: string) => Promise<boolean>
  setCurrentBoard: (board: Board | null) => void
  inviteMember: (boardId: string, email: string, role: 'viewer' | 'editor') => Promise<boolean>
  removeMember: (boardId: string, userId: string) => Promise<boolean>
  clearError: () => void
}

const supabase = createClient()

export const useBoardStore = create<BoardState>()((set, get) => ({
  boards: [],
  currentBoard: null,
  members: [],
  isLoading: false,
  error: null,

  fetchBoards: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) {
        set({ isLoading: false })
        return
      }

      // 自分が所有するボード
      const { data: ownedBoards, error: ownedError } = await supabase
        .from('boards')
        .select('*')
        .eq('owner_id', user.user.id)

      if (ownedError) throw ownedError

      // 自分がメンバーのボード
      const { data: memberBoards, error: memberError } = await supabase
        .from('board_members')
        .select('boards(*)')
        .eq('user_id', user.user.id)

      if (memberError) throw memberError

      const allBoards = [
        ...(ownedBoards || []),
        ...(memberBoards?.map(m => m.boards).filter(Boolean) || [])
      ]

      // 重複を除去
      const uniqueBoards = allBoards.filter((board, index, self) =>
        index === self.findIndex((b) => b?.id === board?.id)
      )

      set({ boards: uniqueBoards as Board[], isLoading: false })
    } catch (error) {
      set({ error: 'Failed to fetch boards', isLoading: false })
    }
  },

  fetchBoardMembers: async (boardId: string) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('board_members')
        .select('*')
        .eq('board_id', boardId)

      if (error) throw error

      set({ members: data || [], isLoading: false })
    } catch (error) {
      set({ error: 'Failed to fetch board members', isLoading: false })
    }
  },

  createBoard: async (name: string) => {
    set({ isLoading: true, error: null })
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('boards')
        .insert({ name, owner_id: user.user.id })
        .select()
        .single()

      if (error) throw error

      // オーナーをエディターとして追加
      await supabase
        .from('board_members')
        .insert({ 
          board_id: data.id, 
          user_id: user.user.id, 
          role: 'editor' 
        })

      const currentBoards = get().boards
      set({ 
        boards: [...currentBoards, data], 
        currentBoard: data,
        isLoading: false 
      })

      return data
    } catch (error) {
      set({ error: 'Failed to create board', isLoading: false })
      return null
    }
  },

  deleteBoard: async (boardId: string) => {
    set({ isLoading: true, error: null })
    try {
      const { error } = await supabase
        .from('boards')
        .delete()
        .eq('id', boardId)

      if (error) throw error

      const currentBoards = get().boards
      const currentBoard = get().currentBoard

      set({ 
        boards: currentBoards.filter(b => b.id !== boardId),
        currentBoard: currentBoard?.id === boardId ? null : currentBoard,
        isLoading: false 
      })

      return true
    } catch (error) {
      set({ error: 'Failed to delete board', isLoading: false })
      return false
    }
  },

  setCurrentBoard: (board: Board | null) => set({ currentBoard: board }),

  inviteMember: async (boardId: string, email: string, role: 'viewer' | 'editor') => {
    set({ isLoading: true, error: null })
    try {
      // メールアドレスからユーザーIDを取得
      const { data: userData, error: userError } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', email)
        .single()

      if (userError || !userData) {
        set({ error: 'User not found', isLoading: false })
        return false
      }

      const { error } = await supabase
        .from('board_members')
        .insert({ 
          board_id: boardId, 
          user_id: userData.id, 
          role 
        })

      if (error) throw error

      await get().fetchBoardMembers(boardId)
      set({ isLoading: false })
      return true
    } catch (error) {
      set({ error: 'Failed to invite member', isLoading: false })
      return false
    }
  },

  removeMember: async (boardId: string, userId: string) => {
    set({ isLoading: true, error: null })
    try {
      const { error } = await supabase
        .from('board_members')
        .delete()
        .eq('board_id', boardId)
        .eq('user_id', userId)

      if (error) throw error

      const currentMembers = get().members
      set({ 
        members: currentMembers.filter(m => m.user_id !== userId),
        isLoading: false 
      })

      return true
    } catch (error) {
      set({ error: 'Failed to remove member', isLoading: false })
      return false
    }
  },

  clearError: () => set({ error: null })
}))
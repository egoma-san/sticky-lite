'use client'

import { useEffect, useState } from 'react'
import { useBoardStore } from '../store/useBoardStore'
import { useAuthStore } from '@/app/features/auth/store/useAuthStore'

export default function BoardSelector() {
  const { boards, currentBoard, isLoading, fetchBoards, setCurrentBoard, createBoard } = useBoardStore()
  const { isAuthenticated } = useAuthStore()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      fetchBoards()
    }
  }, [isAuthenticated, fetchBoards])

  useEffect(() => {
    // 初期ボードの設定
    if (boards.length > 0 && !currentBoard) {
      setCurrentBoard(boards[0])
    }
  }, [boards, currentBoard, setCurrentBoard])

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return

    const board = await createBoard(newBoardName.trim())
    if (board) {
      setNewBoardName('')
      setShowCreateModal(false)
      setShowDropdown(false)
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
      >
        <span className="text-sm font-medium text-gray-700">
          {isLoading ? 'Loading...' : (currentBoard?.name || 'Select Board')}
        </span>
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <div className="absolute top-full mt-2 w-64 bg-white rounded-lg shadow-lg z-50">
          <div className="max-h-60 overflow-y-auto">
            {boards.map((board) => (
              <button
                key={board.id}
                onClick={() => {
                  setCurrentBoard(board)
                  setShowDropdown(false)
                }}
                className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${
                  currentBoard?.id === board.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
              >
                {board.name}
              </button>
            ))}
          </div>
          <div className="border-t">
            <button
              onClick={() => {
                setShowCreateModal(true)
                setShowDropdown(false)
              }}
              className="w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-50 font-medium"
            >
              + Create New Board
            </button>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Create New Board</h3>
            <input
              type="text"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateBoard()}
              placeholder="Board name"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleCreateBoard}
                disabled={!newBoardName.trim()}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewBoardName('')
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
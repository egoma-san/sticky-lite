'use client'

import { useState, useEffect } from 'react'
import { useBoardStore } from '../store/useBoardStore'
import { useAuthStore } from '@/app/features/auth/store/useAuthStore'

export default function BoardSharing() {
  const { currentBoard, members, inviteMember, removeMember, fetchBoardMembers, isLoading, error, clearError } = useBoardStore()
  const { user } = useAuthStore()
  const [showModal, setShowModal] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'viewer' | 'editor'>('viewer')

  useEffect(() => {
    if (currentBoard) {
      fetchBoardMembers(currentBoard.id)
    }
  }, [currentBoard, fetchBoardMembers])

  if (!currentBoard || !user) return null

  const isOwner = currentBoard.owner_id === user.id

  const handleInvite = async () => {
    if (!email.trim()) return

    const success = await inviteMember(currentBoard.id, email.trim(), role)
    if (success) {
      setEmail('')
      setRole('viewer')
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        title="Share Board"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[480px] max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Share "{currentBoard.name}"</h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  clearError()
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {isOwner && (
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-2">Invite Members</h4>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                    placeholder="Email address"
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'viewer' | 'editor')}
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <button
                    onClick={handleInvite}
                    disabled={isLoading || !email.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Invite
                  </button>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium mb-2">Members</h4>
              <div className="space-y-2">
                {/* Owner */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{currentBoard.owner_id === user.id ? 'You' : 'Owner'}</div>
                    <div className="text-sm text-gray-500">Owner</div>
                  </div>
                </div>

                {/* Other members */}
                {members.map((member) => (
                  <div key={member.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{member.user_id === user.id ? 'You' : member.user_id}</div>
                      <div className="text-sm text-gray-500 capitalize">{member.role}</div>
                    </div>
                    {isOwner && member.user_id !== user.id && (
                      <button
                        onClick={() => removeMember(currentBoard.id, member.user_id)}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Permissions:</strong><br />
                • <strong>Viewers</strong> can see all sticky notes<br />
                • <strong>Editors</strong> can create, edit, and delete sticky notes
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
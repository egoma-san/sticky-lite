'use client'

import React, { useState } from 'react'
import { useSnapshots } from '../hooks/useSnapshots'
import { useStickies } from '@/app/features/sticky-notes/hooks/useStickies'
import { useStickyStore } from '@/app/features/sticky-notes/store/useStickyStore'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import LoadSnapshotDialog from './LoadSnapshotDialog'

interface SnapshotModalProps {
  onClose: () => void
}

export default function SnapshotModal({ onClose }: SnapshotModalProps) {
  const { snapshots, isLoading, error, maxSnapshots, canSaveMore, saveSnapshot, loadSnapshot, deleteSnapshot, clearError } = useSnapshots()
  const { stickies } = useStickies()
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [loadDialogState, setLoadDialogState] = useState<{
    isOpen: boolean
    snapshotId: string
    snapshotName: string
    snapshotStickiesCount: number
  } | null>(null)
  
  const handleSave = async () => {
    if (!name.trim()) return
    
    setSaving(true)
    try {
      await saveSnapshot(name, description)
      setName('')
      setDescription('')
      setShowSaveForm(false)
    } catch (error) {
      console.error('Failed to save snapshot:', error)
    } finally {
      setSaving(false)
    }
  }
  
  const handleLoadClick = (snapshot: { id: string; name: string; stickies: any[] }) => {
    const stickyStore = useStickyStore.getState()
    const hasExistingStickies = stickyStore.stickies.length > 0
    
    if (hasExistingStickies) {
      // Show dialog to ask user preference
      setLoadDialogState({
        isOpen: true,
        snapshotId: snapshot.id,
        snapshotName: snapshot.name,
        snapshotStickiesCount: snapshot.stickies.length
      })
    } else {
      // No existing stickies, just load directly
      handleLoad(snapshot.id, true)
    }
  }
  
  const handleLoad = async (snapshotId: string, replaceExisting: boolean) => {
    setLoadingId(snapshotId)
    try {
      const result = await loadSnapshot(snapshotId)
      if (result) {
        const stickyStore = useStickyStore.getState()
        
        // Clear existing stickies if user chose to replace
        if (replaceExisting) {
          stickyStore.clearAll()
        }
        
        // Add stickies from snapshot
        result.forEach(sticky => {
          // Add sticky with position and color
          stickyStore.addSticky(sticky.x, sticky.y, sticky.color)
          
          // Get the newly added sticky (last one in array)
          const newSticky = stickyStore.stickies[stickyStore.stickies.length - 1]
          if (newSticky) {
            // Update text
            if (sticky.text || sticky.richText) {
              stickyStore.updateStickyText(newSticky.id, sticky.text, sticky.richText)
            }
            // Update size
            if (sticky.size && sticky.size !== 1) {
              stickyStore.updateStickySize(newSticky.id, sticky.size)
            }
            // Update font size
            if (sticky.fontSize && sticky.fontSize !== 16) {
              stickyStore.updateStickyFontSize(newSticky.id, sticky.fontSize)
            }
            // Update format
            if (sticky.isBold || sticky.isItalic || sticky.isUnderline) {
              stickyStore.updateStickyFormat(newSticky.id, {
                isBold: sticky.isBold,
                isItalic: sticky.isItalic,
                isUnderline: sticky.isUnderline
              })
            }
          }
        })
        
        const message = replaceExisting ? 'スナップショットを読み込みました' : 'スナップショットを追加しました'
        window.alert(message)
        onClose()
      }
    } finally {
      setLoadingId(null)
      setLoadDialogState(null)
    }
  }
  
  const handleDelete = async (snapshotId: string) => {
    if (window.confirm('このスナップショットを削除してもよろしいですか？')) {
      await deleteSnapshot(snapshotId)
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">スナップショット</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            現在の状態を保存して、後で復元できます（最大{maxSnapshots}件）
          </p>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 200px)' }}>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
              <button
                onClick={clearError}
                className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
              >
                閉じる
              </button>
            </div>
          )}
          
          {/* Save new snapshot */}
          {canSaveMore && (
            <div className="mb-6">
              {!showSaveForm ? (
                <button
                  onClick={() => setShowSaveForm(true)}
                  disabled={stickies.length === 0}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-gray-600">新しいスナップショットを保存</span>
                  </div>
                  {stickies.length === 0 && (
                    <p className="mt-2 text-sm text-gray-500">付箋がありません</p>
                  )}
                </button>
              ) : (
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium mb-3">新しいスナップショット</h3>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="名前を入力"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={100}
                  />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="説明（任意）"
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    maxLength={500}
                  />
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={!name.trim() || saving}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? '保存中...' : '保存'}
                    </button>
                    <button
                      onClick={() => {
                        setShowSaveForm(false)
                        setName('')
                        setDescription('')
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Snapshot list */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : snapshots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>スナップショットがありません</p>
            </div>
          ) : (
            <div className="space-y-3">
              {snapshots.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{snapshot.name}</h3>
                      {snapshot.description && (
                        <p className="mt-1 text-sm text-gray-600">{snapshot.description}</p>
                      )}
                      <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
                        <span>{snapshot.stickies.length}個の付箋</span>
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(snapshot.createdAt, { 
                            addSuffix: true,
                            locale: ja 
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleLoadClick(snapshot)}
                        disabled={loadingId === snapshot.id}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingId === snapshot.id ? '読み込み中...' : '読み込む'}
                      </button>
                      <button
                        onClick={() => handleDelete(snapshot.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="削除"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Load Dialog */}
      {loadDialogState && (
        <LoadSnapshotDialog
          isOpen={loadDialogState.isOpen}
          onClose={() => setLoadDialogState(null)}
          onConfirm={(replaceExisting) => {
            handleLoad(loadDialogState.snapshotId, replaceExisting)
          }}
          currentStickiesCount={stickies.length}
          snapshotStickiesCount={loadDialogState.snapshotStickiesCount}
          snapshotName={loadDialogState.snapshotName}
        />
      )}
    </div>
  )
}
'use client'

import React from 'react'

interface LoadSnapshotDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (replaceExisting: boolean) => void
  currentStickiesCount: number
  snapshotStickiesCount: number
  snapshotName: string
}

export default function LoadSnapshotDialog({
  isOpen,
  onClose,
  onConfirm,
  currentStickiesCount,
  snapshotStickiesCount,
  snapshotName
}: LoadSnapshotDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          スナップショットの読み込み方法
        </h3>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-2">
            スナップショット「{snapshotName}」を読み込みます。
          </p>
          <div className="text-sm text-gray-500 space-y-1">
            <p>• 現在のボード: {currentStickiesCount}個の付箋</p>
            <p>• スナップショット: {snapshotStickiesCount}個の付箋</p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => onConfirm(true)}
            className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-800 group-hover:text-blue-700">
                  置き換える
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  現在の付箋をすべて削除してから、スナップショットを読み込みます
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onConfirm(false)}
            className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-800 group-hover:text-green-700">
                  追加する
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  現在の付箋を残したまま、スナップショットの付箋を追加します
                </p>
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          キャンセル
        </button>
      </div>
    </div>
  )
}
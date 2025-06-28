'use client'

import React from 'react'
import Link from 'next/link'
import { useStickyStore } from '../features/sticky-notes'

export default function ListPage() {
  const { stickies, deleteSticky, deleteMultiple } = useStickyStore()
  const [checkedItems, setCheckedItems] = React.useState<Set<string>>(new Set())

  const handleCheck = (id: string) => {
    const newChecked = new Set(checkedItems)
    if (newChecked.has(id)) {
      newChecked.delete(id)
    } else {
      newChecked.add(id)
    }
    setCheckedItems(newChecked)
  }

  const handleDelete = (id: string) => {
    deleteSticky(id)
    const newChecked = new Set(checkedItems)
    newChecked.delete(id)
    setCheckedItems(newChecked)
  }

  const handleDeleteSelected = () => {
    if (checkedItems.size > 0) {
      deleteMultiple(Array.from(checkedItems))
      setCheckedItems(new Set())
    }
  }

  const handleSelectAll = () => {
    if (checkedItems.size === stickies.length) {
      setCheckedItems(new Set())
    } else {
      setCheckedItems(new Set(stickies.map(s => s.id)))
    }
  }

  const sortedStickies = [...stickies].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const getColorClass = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-900'
      case 'pink':
        return 'bg-pink-100 text-pink-900'
      default:
        return 'bg-yellow-100 text-yellow-900'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">付箋リスト</h1>
          <Link
            href="/"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            ボードに戻る
          </Link>
        </div>

        {/* Action buttons */}
        {stickies.length > 0 && (
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              {checkedItems.size === stickies.length ? '全選択解除' : '全選択'}
            </button>
            {checkedItems.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                選択した{checkedItems.size}件を削除
              </button>
            )}
          </div>
        )}

        {/* Table */}
        {stickies.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">付箋がありません</p>
            <Link
              href="/"
              className="inline-block mt-4 text-blue-500 hover:text-blue-600"
            >
              ボードで付箋を作成する
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={checkedItems.size === stickies.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">内容</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-24">色</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-32">作成日時</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 w-20">削除</th>
                </tr>
              </thead>
              <tbody>
                {sortedStickies.map((sticky) => (
                  <tr key={sticky.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={checkedItems.has(sticky.id)}
                        onChange={() => handleCheck(sticky.id)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {sticky.text || '(空の付箋)'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getColorClass(sticky.color)}`}>
                        {sticky.color === 'yellow' ? '黄' : sticky.color === 'blue' ? '青' : 'ピンク'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(sticky.createdAt).toLocaleString('ja-JP', {
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(sticky.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="削除"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
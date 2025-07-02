'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useStickies } from '../features/sticky-notes/hooks/useStickies'
import { useAuthStore } from '../features/auth/store/useAuthStore'
import { isSupabaseEnabled } from '@/app/lib/features'
import { exportToCSV, downloadCSV, importFromCSV, readFileAsText } from '../features/sticky-notes/utils/csv'
import { Sticky } from '../features/sticky-notes/types'

type SortKey = 'content' | 'color' | 'createdAt' | null
type SortOrder = 'asc' | 'desc'

export default function ListPage() {
  const { 
    stickies, 
    deleteSticky, 
    deleteMultiple, 
    addSticky, 
    updateStickyPosition,
    updateStickyText,
    updateStickySize,
    updateStickyColor,
    updateStickyFontSize,
    updateStickyFormat
  } = useStickies()
  const [checkedItems, setCheckedItems] = React.useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = React.useState<SortKey>(null)
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('asc')
  const [isImporting, setIsImporting] = React.useState(false)
  const router = useRouter()
  const { logout, isAuthenticated, user } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortOrder === 'asc') {
        setSortOrder('desc')
      } else {
        // Reset sort
        setSortKey(null)
        setSortOrder('asc')
      }
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }
  }

  const sortedStickies = React.useMemo(() => {
    const sorted = [...stickies]
    
    if (!sortKey) {
      // Default sort by creation date (newest first)
      return sorted.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }
    
    sorted.sort((a, b) => {
      let aValue: any
      let bValue: any
      
      switch (sortKey) {
        case 'content':
          aValue = a.text || ''
          bValue = b.text || ''
          break
        case 'color':
          aValue = a.color
          bValue = b.color
          break
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })
    
    return sorted
  }, [stickies, sortKey, sortOrder])

  const getColorClass = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-900'
      case 'pink':
        return 'bg-pink-100 text-pink-900'
      case 'green':
        return 'bg-green-100 text-green-900'
      case 'purple':
        return 'bg-purple-100 text-purple-900'
      case 'orange':
        return 'bg-orange-100 text-orange-900'
      case 'yellow':
      default:
        return 'bg-yellow-100 text-yellow-900'
    }
  }

  const handleNavigateToSticky = (id: string) => {
    router.push(`/?focus=${id}`)
  }

  const importStickies = async (importedStickies: Sticky[]) => {
    for (const sticky of importedStickies) {
      // Use imported position or generate random position
      const x = sticky.x || (4000 + Math.random() * 2000)
      const y = sticky.y || (4000 + Math.random() * 2000)
      
      // Create sticky with basic properties
      await addSticky(x, y, sticky.color)
      
      // Get the ID of the newly created sticky
      // Note: This is a workaround. In production, addSticky should return the new sticky
      const currentStickies = useStickies.getState ? useStickies.getState().stickies : stickies
      const newSticky = currentStickies[currentStickies.length - 1]
      
      if (newSticky) {
        // Update all properties
        if (sticky.text || sticky.richText) {
          await updateStickyText(newSticky.id, sticky.text || '', sticky.richText)
        }
        if (sticky.size && sticky.size !== 1) {
          await updateStickySize(newSticky.id, sticky.size)
        }
        if (sticky.fontSize && sticky.fontSize !== 16) {
          await updateStickyFontSize(newSticky.id, sticky.fontSize)
        }
        if (sticky.isBold || sticky.isItalic || sticky.isUnderline) {
          await updateStickyFormat(newSticky.id, {
            isBold: sticky.isBold,
            isItalic: sticky.isItalic,
            isUnderline: sticky.isUnderline
          })
        }
      }
    }
  }

  const handleExportCSV = () => {
    const selectedStickies = checkedItems.size > 0 
      ? stickies.filter(s => checkedItems.has(s.id))
      : stickies
      
    const csv = exportToCSV(selectedStickies)
    const filename = `sticky-notes-${new Date().toISOString().split('T')[0]}.csv`
    downloadCSV(csv, filename)
  }

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const csvContent = await readFileAsText(file)
      const importedStickies = importFromCSV(csvContent)
      
      // Import stickies with all their properties
      await importStickies(importedStickies)
      
      alert(`${importedStickies.length}件の付箋をインポートしました`)
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Import error:', error)
      alert('インポートに失敗しました: ' + (error as Error).message)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">付箋リスト</h1>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              ボードに戻る
            </Link>
            {/* Login button */}
            {isSupabaseEnabled() ? (
              isAuthenticated ? (
                <>
                  <span className="text-sm text-gray-600 hidden sm:inline">
                    {user?.email}
                  </span>
                  <button
                    onClick={() => {
                      const confirmLogout = window.confirm(
                        'ログアウトすると、クラウドの付箋にアクセスできなくなります。\nローカルには保存されません。\n\n本当にログアウトしますか？'
                      )
                      if (confirmLogout) {
                        logout()
                        // Don't redirect, just stay on the page
                      }
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    ログアウト
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  ログイン
                </Link>
              )
            ) : (
              <div 
                className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed opacity-60"
                title="近日公開予定"
              >
                ログイン (近日公開)
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-4 mb-6">
          {stickies.length > 0 && (
            <>
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
            </>
          )}
          
          <div className="flex gap-2 ml-auto">
            <button
              onClick={handleExportCSV}
              disabled={stickies.length === 0}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              {checkedItems.size > 0 ? `選択した${checkedItems.size}件をエクスポート` : 'CSVエクスポート'}
            </button>
            
            <label className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {isImporting ? 'インポート中...' : 'CSVインポート'}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                disabled={isImporting}
                className="hidden"
              />
            </label>
          </div>
        </div>

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
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    <button
                      onClick={() => handleSort('content')}
                      className={`flex items-center gap-1 w-full text-left transition-all ${
                        sortKey === 'content' 
                          ? 'transform translate-y-0.5 shadow-inner bg-gray-200 rounded px-2 py-1' 
                          : 'hover:bg-gray-200 rounded px-2 py-1'
                      }`}
                    >
                      内容
                      {sortKey === 'content' && (
                        <svg className={`w-4 h-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-24">
                    <button
                      onClick={() => handleSort('color')}
                      className={`flex items-center gap-1 w-full text-left transition-all ${
                        sortKey === 'color' 
                          ? 'transform translate-y-0.5 shadow-inner bg-gray-200 rounded px-2 py-1' 
                          : 'hover:bg-gray-200 rounded px-2 py-1'
                      }`}
                    >
                      色
                      {sortKey === 'color' && (
                        <svg className={`w-4 h-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-32">
                    <button
                      onClick={() => handleSort('createdAt')}
                      className={`flex items-center gap-1 w-full text-left transition-all ${
                        sortKey === 'createdAt' 
                          ? 'transform translate-y-0.5 shadow-inner bg-gray-200 rounded px-2 py-1' 
                          : 'hover:bg-gray-200 rounded px-2 py-1'
                      }`}
                    >
                      作成日時
                      {sortKey === 'createdAt' && (
                        <svg className={`w-4 h-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </button>
                  </th>
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
                    <td 
                      className="px-4 py-3 cursor-pointer"
                      onDoubleClick={() => handleNavigateToSticky(sticky.id)}
                      title="ダブルクリックで付箋に移動"
                    >
                      {sticky.richText ? (
                        <div 
                          className="text-gray-800 select-none"
                          dangerouslySetInnerHTML={{ 
                            __html: sticky.richText || '<span class="text-gray-400">(空の付箋)</span>' 
                          }}
                        />
                      ) : (
                        <p className="text-gray-800 whitespace-pre-wrap select-none">
                          {sticky.text || '(空の付箋)'}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getColorClass(sticky.color)}`}>
                        {sticky.color === 'yellow' ? '黄' : 
                         sticky.color === 'blue' ? '青' : 
                         sticky.color === 'pink' ? 'ピンク' :
                         sticky.color === 'green' ? '緑' :
                         sticky.color === 'purple' ? '紫' :
                         sticky.color === 'orange' ? 'オレンジ' : '黄'}
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
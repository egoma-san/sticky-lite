'use client'

import React, { useState } from 'react'
import { formatShortcut, isIOS, isMobile } from '../utils/platform'

export default function InfoButton() {
  const [showInfo, setShowInfo] = useState(false)
  const isIOSDevice = isIOS()
  const isMobileDevice = isMobile()

  return (
    <>
      {/* Info button */}
      <button
        className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center"
        onClick={() => setShowInfo(!showInfo)}
        title="ショートカット一覧"
      >
        <span className="text-gray-600 font-bold text-sm sm:text-base">i</span>
      </button>

      {/* Info modal */}
      {showInfo && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowInfo(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  {isIOSDevice ? '操作ガイド' : 'キーボードショートカット'}
                </h2>
                <button
                  onClick={() => setShowInfo(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="text-sm text-gray-500 mb-3">
                デバイス: {isIOSDevice ? 'iPhone/iPad' : (formatShortcut('Ctrl/Cmd').includes('Cmd') ? 'Mac' : 'Windows/Linux')}
              </div>

              <div className="space-y-4">
                {isIOSDevice ? (
                  // iPhone/iPad専用の内容
                  <>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-blue-800 mb-2">📱 基本操作</h3>
                      <ul className="space-y-1.5 text-sm text-blue-700">
                        <li>• <span className="font-semibold">ダブルタップ</span>: 付箋を作成</li>
                        <li>• <span className="font-semibold">タップ</span>: 付箋を選択・編集モードへ</li>
                        <li>• <span className="font-semibold">長押し＋ドラッグ</span>: 付箋を移動</li>
                        <li>• <span className="font-semibold">ゴミ箱へドラッグ</span>: 付箋を削除</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">🔍 表示の調整</h3>
                      <ul className="space-y-1.5 text-sm text-gray-600">
                        <li>• <span className="font-semibold">ピンチイン/アウト</span>: ズーム調整</li>
                        <li>• <span className="font-semibold">2本指でスワイプ</span>: ボード全体を移動</li>
                        <li>• <span className="font-semibold">付箋の角の丸</span>: サイズ変更</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">✏️ テキスト編集</h3>
                      <ul className="space-y-1.5 text-sm text-gray-600">
                        <li>• 付箋をタップして編集開始</li>
                        <li>• ツールバーで太字・斜体・下線を設定</li>
                        <li>• 付箋の外をタップして編集終了</li>
                      </ul>
                    </div>

                    {/* 外部キーボード接続時の情報 */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-700 mb-2">⌨️ 外部キーボード使用時</h3>
                      <ul className="space-y-1 text-xs text-gray-600">
                        <li>• <kbd>Cmd + B</kbd>: 太字</li>
                        <li>• <kbd>Cmd + I</kbd>: 斜体</li>
                        <li>• <kbd>Cmd + U</kbd>: 下線</li>
                        <li>• <kbd>Delete</kbd>: 選択した付箋を削除</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  // Mac/PC用の内容
                  <>
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">付箋の操作</h3>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>• ダブルクリック: 付箋を作成</li>
                        <li>• Delete/Backspace: 選択した付箋を削除</li>
                        <li>• Shift + ドラッグ: 複数選択</li>
                        <li>• ESC: 編集モードを終了</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">テキストフォーマット</h3>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>• <kbd>{formatShortcut('Ctrl/Cmd + B')}</kbd>: 太字</li>
                        <li>• <kbd>{formatShortcut('Ctrl/Cmd + I')}</kbd>: イタリック</li>
                        <li>• <kbd>{formatShortcut('Ctrl/Cmd + U')}</kbd>: アンダーライン</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">文字サイズ</h3>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>• <kbd>{formatShortcut('Ctrl/Cmd + Shift + >')}</kbd>: 文字を大きく</li>
                        <li>• <kbd>{formatShortcut('Ctrl/Cmd + Shift + <')}</kbd>: 文字を小さく</li>
                        <li className="text-xs text-gray-500 mt-1">または</li>
                        <li>• <kbd>{formatShortcut('Ctrl/Cmd + +')}</kbd>: 文字を大きく</li>
                        <li>• <kbd>{formatShortcut('Ctrl/Cmd + -')}</kbd>: 文字を小さく</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">ズーム</h3>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>• <kbd>{formatShortcut('Ctrl/Cmd')} + マウスホイール</kbd>: ズームイン/アウト</li>
                        <li>• 左下のボタンでもズーム調整可能</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">その他</h3>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>• ドラッグ: 付箋を移動</li>
                        <li>• 角の白い丸: 付箋のサイズ変更</li>
                        <li>• 中ボタンドラッグ: ボード全体を移動</li>
                      </ul>
                    </div>

                    {/* モバイルデバイス向けの情報 */}
                    {isMobileDevice && (
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <h3 className="font-semibold text-blue-800 mb-2">📱 タッチ操作も利用可能</h3>
                        <ul className="space-y-1 text-xs text-blue-700">
                          <li>• ピンチでズーム調整</li>
                          <li>• 2本指スワイプでボード移動</li>
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
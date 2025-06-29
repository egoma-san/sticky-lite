'use client'

import React, { useRef, useEffect, useState } from 'react'
import { formatShortcut } from '../utils/platform'

interface RichTextEditorProps {
  value: string
  richText?: string
  onChange: (text: string, richText: string) => void
  onFocus?: () => void
  onBlur?: () => void
  fontSize?: number
  autoFocus?: boolean
  className?: string
}

export default function RichTextEditor({
  value,
  richText,
  onChange,
  onFocus,
  onBlur,
  fontSize = 16,
  autoFocus = false,
  className = ''
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isComposing, setIsComposing] = useState(false)

  // Initialize content
  useEffect(() => {
    if (editorRef.current && richText !== undefined) {
      // If we have richText, use it; otherwise use plain text
      if (richText) {
        editorRef.current.innerHTML = richText
      } else if (value) {
        editorRef.current.textContent = value
      }
    }
  }, [])

  // Auto focus
  useEffect(() => {
    if (autoFocus && editorRef.current) {
      // Small delay for iOS
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.focus()
          // Move cursor to end
          const range = document.createRange()
          const sel = window.getSelection()
          if (sel && editorRef.current.childNodes.length > 0) {
            range.selectNodeContents(editorRef.current)
            range.collapse(false)
            sel.removeAllRanges()
            sel.addRange(range)
          }
        }
      }, 100)
    }
  }, [autoFocus])

  const handleInput = () => {
    if (editorRef.current && !isComposing) {
      const plainText = editorRef.current.textContent || ''
      const richHtml = editorRef.current.innerHTML
      onChange(plainText, richHtml)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const metaKey = isMac ? e.metaKey : e.ctrlKey

    if (metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault()
          document.execCommand('bold', false)
          handleInput()
          break
        case 'i':
          e.preventDefault()
          document.execCommand('italic', false)
          handleInput()
          break
        case 'u':
          e.preventDefault()
          document.execCommand('underline', false)
          handleInput()
          break
      }
    }

    // Prevent Enter from creating divs
    if (e.key === 'Enter') {
      e.preventDefault()
      document.execCommand('insertLineBreak', false)
      handleInput()
    }

    // Handle ESC key
    if (e.key === 'Escape') {
      e.preventDefault()
      if (onBlur) {
        onBlur()
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
    handleInput()
  }

  return (
    <div
      ref={editorRef}
      contentEditable
      className={`w-full h-full resize-none bg-transparent focus:outline-none p-4 ${className}`}
      style={{
        fontSize: `${fontSize}px`,
        lineHeight: 1.5,
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
        minHeight: '100%',
        WebkitUserSelect: 'text',
        userSelect: 'text',
        WebkitTouchCallout: 'none'
      }}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onFocus={onFocus}
      onBlur={onBlur}
      onCompositionStart={() => setIsComposing(true)}
      onCompositionEnd={() => {
        setIsComposing(false)
        handleInput()
      }}
      onTouchEnd={(e) => {
        // iOS Safari fix: ensure contentEditable gets focus on touch
        if (editorRef.current && document.activeElement !== editorRef.current) {
          e.preventDefault()
          editorRef.current.focus()
        }
      }}
      suppressContentEditableWarning={true}
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck={true}
    />
  )
}
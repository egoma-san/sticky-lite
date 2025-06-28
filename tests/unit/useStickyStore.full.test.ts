import { act, renderHook } from '@testing-library/react'
import { useStickyStore } from '../../app/features/sticky-notes/store/useStickyStore'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('useStickyStore - Extended Tests', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  it('should initialize with empty stickies', () => {
    const { result } = renderHook(() => useStickyStore())
    expect(result.current.stickies).toEqual([])
    expect(result.current.selectedColor).toBe('yellow')
  })

  it('should add sticky with specific position and color', () => {
    const { result } = renderHook(() => useStickyStore())
    
    act(() => {
      result.current.addSticky(150, 250, 'blue')
    })
    
    expect(result.current.stickies).toHaveLength(1)
    expect(result.current.stickies[0]).toMatchObject({
      x: 150,
      y: 250,
      text: '',
      color: 'blue',
      size: 1,
      fontSize: 16,
      isBold: false,
      isItalic: false,
      isUnderline: false,
    })
  })

  it('should update sticky size', () => {
    const { result } = renderHook(() => useStickyStore())
    
    act(() => {
      result.current.addSticky(100, 100)
    })
    
    const stickyId = result.current.stickies[0].id
    
    act(() => {
      result.current.updateStickySize(stickyId, 2)
    })
    
    expect(result.current.stickies[0].size).toBe(2)
  })

  it('should update sticky font size', () => {
    const { result } = renderHook(() => useStickyStore())
    
    act(() => {
      result.current.addSticky(100, 100)
    })
    
    const stickyId = result.current.stickies[0].id
    
    act(() => {
      result.current.updateStickyFontSize(stickyId, 24)
    })
    
    expect(result.current.stickies[0].fontSize).toBe(24)
  })

  it('should update sticky format', () => {
    const { result } = renderHook(() => useStickyStore())
    
    act(() => {
      result.current.addSticky(100, 100)
    })
    
    const stickyId = result.current.stickies[0].id
    
    act(() => {
      result.current.updateStickyFormat(stickyId, { isBold: true })
    })
    
    expect(result.current.stickies[0].isBold).toBe(true)
    expect(result.current.stickies[0].isItalic).toBe(false)
    expect(result.current.stickies[0].isUnderline).toBe(false)
    
    act(() => {
      result.current.updateStickyFormat(stickyId, { isItalic: true, isUnderline: true })
    })
    
    expect(result.current.stickies[0].isBold).toBe(true)
    expect(result.current.stickies[0].isItalic).toBe(true)
    expect(result.current.stickies[0].isUnderline).toBe(true)
  })

  it('should delete multiple stickies', () => {
    const { result } = renderHook(() => useStickyStore())
    
    act(() => {
      result.current.addSticky(100, 100)
      result.current.addSticky(200, 200)
      result.current.addSticky(300, 300)
    })
    
    const ids = result.current.stickies.slice(0, 2).map(s => s.id)
    
    act(() => {
      result.current.deleteMultiple(ids)
    })
    
    expect(result.current.stickies).toHaveLength(1)
    expect(result.current.stickies[0].x).toBe(300)
  })

  it('should not update non-existent sticky', () => {
    const { result } = renderHook(() => useStickyStore())
    
    act(() => {
      result.current.updateStickyText('non-existent', 'test')
      result.current.updateStickyPosition('non-existent', 100, 100)
      result.current.updateStickySize('non-existent', 2)
      result.current.updateStickyFontSize('non-existent', 24)
      result.current.updateStickyFormat('non-existent', { isBold: true })
    })
    
    expect(result.current.stickies).toHaveLength(0)
  })

  it('should persist to localStorage', () => {
    const { result } = renderHook(() => useStickyStore())
    
    act(() => {
      result.current.addSticky(100, 100)
      result.current.setSelectedColor('blue')
    })
    
    const stored = JSON.parse(localStorageMock.getItem('sticky-store') || '{}')
    expect(stored.state.stickies).toHaveLength(1)
    expect(stored.state.selectedColor).toBe('blue')
  })

  it('should load from localStorage on initialization', () => {
    const initialState = {
      state: {
        stickies: [
          {
            id: 'test-1',
            x: 100,
            y: 100,
            text: 'Loaded from storage',
            color: 'pink',
            createdAt: new Date().toISOString(),
            size: 1.5,
            fontSize: 20,
            isBold: true,
            isItalic: false,
            isUnderline: true,
          },
        ],
        selectedColor: 'pink',
      },
      version: 2,
    }
    
    localStorageMock.setItem('sticky-store', JSON.stringify(initialState))
    
    const { result } = renderHook(() => useStickyStore())
    
    expect(result.current.stickies).toHaveLength(1)
    expect(result.current.stickies[0].text).toBe('Loaded from storage')
    expect(result.current.stickies[0].color).toBe('pink')
    expect(result.current.stickies[0].size).toBe(1.5)
    expect(result.current.stickies[0].fontSize).toBe(20)
    expect(result.current.stickies[0].isBold).toBe(true)
    expect(result.current.stickies[0].isUnderline).toBe(true)
    expect(result.current.selectedColor).toBe('pink')
  })

  it('should handle migration from version 0', () => {
    const oldState = {
      state: {
        stickies: [
          {
            id: 'old-1',
            x: 100,
            y: 100,
            text: 'Old sticky',
            color: 'yellow',
            createdAt: new Date().toISOString(),
          },
        ],
        selectedColor: 'yellow',
      },
      version: 0,
    }
    
    localStorageMock.setItem('sticky-store', JSON.stringify(oldState))
    
    const { result } = renderHook(() => useStickyStore())
    
    expect(result.current.stickies).toHaveLength(1)
    expect(result.current.stickies[0].size).toBe(1)
  })

  it('should handle migration from version 1', () => {
    const oldState = {
      state: {
        stickies: [
          {
            id: 'old-1',
            x: 100,
            y: 100,
            text: 'Old sticky',
            color: 'yellow',
            createdAt: new Date().toISOString(),
            size: 2,
          },
        ],
        selectedColor: 'yellow',
      },
      version: 1,
    }
    
    localStorageMock.setItem('sticky-store', JSON.stringify(oldState))
    
    const { result } = renderHook(() => useStickyStore())
    
    expect(result.current.stickies).toHaveLength(1)
    expect(result.current.stickies[0].fontSize).toBe(16)
    expect(result.current.stickies[0].isBold).toBe(false)
    expect(result.current.stickies[0].isItalic).toBe(false)
    expect(result.current.stickies[0].isUnderline).toBe(false)
  })

  it('should handle invalid localStorage data', () => {
    localStorageMock.setItem('sticky-store', 'invalid json')
    
    const { result } = renderHook(() => useStickyStore())
    
    expect(result.current.stickies).toEqual([])
    expect(result.current.selectedColor).toBe('yellow')
  })

  it('should handle empty deleteMultiple call', () => {
    const { result } = renderHook(() => useStickyStore())
    
    act(() => {
      result.current.addSticky(100, 100)
    })
    
    const initialLength = result.current.stickies.length
    
    act(() => {
      result.current.deleteMultiple([])
    })
    
    expect(result.current.stickies).toHaveLength(initialLength)
  })

  it('should handle deleteMultiple with non-existent ids', () => {
    const { result } = renderHook(() => useStickyStore())
    
    act(() => {
      result.current.addSticky(100, 100)
    })
    
    const initialLength = result.current.stickies.length
    
    act(() => {
      result.current.deleteMultiple(['non-existent-1', 'non-existent-2'])
    })
    
    expect(result.current.stickies).toHaveLength(initialLength)
  })
})
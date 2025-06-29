import { renderHook } from '@testing-library/react'
import { useStickies } from '../../app/features/sticky-notes/hooks/useStickies'
import { useAuthStore } from '../../app/features/auth/store/useAuthStore'
import { useStickyStore } from '../../app/features/sticky-notes/store/useStickyStore'
import { useBoardStore } from '../../app/features/boards/store/useBoardStore'

// Mock stores
jest.mock('../../app/features/auth/store/useAuthStore')
jest.mock('../../app/features/sticky-notes/store/useStickyStore')
jest.mock('../../app/features/sticky-notes/store/useSupabaseStickyStore')
jest.mock('../../app/features/boards/store/useBoardStore')

describe('useStickies', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock auth store - not authenticated by default
    ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null
    })
    
    // Mock board store
    ;(useBoardStore as unknown as jest.Mock).mockReturnValue({
      currentBoard: null,
      setCurrentBoard: jest.fn(),
      createBoard: jest.fn(),
      fetchBoards: jest.fn()
    })
    
    // Mock local sticky store
    ;(useStickyStore as unknown as jest.Mock).mockReturnValue({
      stickies: [],
      selectedColor: 'yellow',
      setSelectedColor: jest.fn(),
      addSticky: jest.fn(),
      updateStickyText: jest.fn(),
      updateStickyPosition: jest.fn(),
      updateStickySize: jest.fn(),
      updateStickyFontSize: jest.fn(),
      updateStickyFormat: jest.fn(),
      deleteSticky: jest.fn(),
      deleteMultiple: jest.fn(),
      clearAll: jest.fn()
    })
  })

  it('should use local store when not authenticated', () => {
    const { result } = renderHook(() => useStickies())
    
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.stickies).toEqual([])
    expect(result.current.selectedColor).toBe('yellow')
  })

  it('should provide async wrappers for local store methods', async () => {
    const mockAddSticky = jest.fn()
    const mockUpdateText = jest.fn()
    
    ;(useStickyStore as unknown as jest.Mock).mockReturnValue({
      stickies: [],
      selectedColor: 'yellow',
      setSelectedColor: jest.fn(),
      addSticky: mockAddSticky,
      updateStickyText: mockUpdateText,
      updateStickyPosition: jest.fn(),
      updateStickySize: jest.fn(),
      updateStickyFontSize: jest.fn(),
      updateStickyFormat: jest.fn(),
      deleteSticky: jest.fn(),
      deleteMultiple: jest.fn(),
      clearAll: jest.fn()
    })
    
    const { result } = renderHook(() => useStickies())
    
    // Test addSticky
    await result.current.addSticky(100, 200, 'blue')
    expect(mockAddSticky).toHaveBeenCalledWith(100, 200, 'blue')
    
    // Test updateStickyText
    await result.current.updateStickyText('123', 'Hello', '<p>Hello</p>')
    expect(mockUpdateText).toHaveBeenCalledWith('123', 'Hello', '<p>Hello</p>')
  })

  it('should handle local stickies operations', async () => {
    const mockStore = {
      stickies: [
        { id: '1', x: 0, y: 0, text: 'Test', color: 'yellow', createdAt: new Date() }
      ],
      selectedColor: 'blue',
      setSelectedColor: jest.fn(),
      addSticky: jest.fn(),
      updateStickyText: jest.fn(),
      updateStickyPosition: jest.fn(),
      updateStickySize: jest.fn(),
      updateStickyFontSize: jest.fn(),
      updateStickyFormat: jest.fn(),
      deleteSticky: jest.fn(),
      deleteMultiple: jest.fn(),
      clearAll: jest.fn()
    }
    
    ;(useStickyStore as unknown as jest.Mock).mockReturnValue(mockStore)
    
    const { result } = renderHook(() => useStickies())
    
    expect(result.current.stickies).toHaveLength(1)
    expect(result.current.stickies[0].text).toBe('Test')
    expect(result.current.selectedColor).toBe('blue')
    
    // Test all operations
    await result.current.updateStickyPosition('1', 100, 100)
    expect(mockStore.updateStickyPosition).toHaveBeenCalledWith('1', 100, 100)
    
    await result.current.updateStickySize('1', 2)
    expect(mockStore.updateStickySize).toHaveBeenCalledWith('1', 2)
    
    await result.current.updateStickyFontSize('1', 24)
    expect(mockStore.updateStickyFontSize).toHaveBeenCalledWith('1', 24)
    
    await result.current.updateStickyFormat('1', { isBold: true })
    expect(mockStore.updateStickyFormat).toHaveBeenCalledWith('1', { isBold: true })
    
    await result.current.deleteSticky('1')
    expect(mockStore.deleteSticky).toHaveBeenCalledWith('1')
    
    await result.current.deleteMultiple(['1', '2'])
    expect(mockStore.deleteMultiple).toHaveBeenCalledWith(['1', '2'])
    
    await result.current.clearAll()
    expect(mockStore.clearAll).toHaveBeenCalled()
  })
})
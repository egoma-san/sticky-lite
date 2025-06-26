import { renderHook, act } from '@testing-library/react'
import { useStickyStore } from '@/app/store/useStickyStore'

describe('useStickyStore', () => {
  beforeEach(() => {
    // Clear store between tests
    const { result } = renderHook(() => useStickyStore())
    act(() => {
      result.current.clearAll()
    })
  })

  it('should add a new sticky note', () => {
    const { result } = renderHook(() => useStickyStore())
    
    act(() => {
      result.current.addSticky(100, 200)
    })

    expect(result.current.stickies).toHaveLength(1)
    expect(result.current.stickies[0]).toMatchObject({
      x: 100,
      y: 200,
      text: ''
    })
    expect(result.current.stickies[0].id).toBeDefined()
  })

  it('should update sticky text', () => {
    const { result } = renderHook(() => useStickyStore())
    
    act(() => {
      result.current.addSticky(100, 200)
    })

    const stickyId = result.current.stickies[0].id

    act(() => {
      result.current.updateStickyText(stickyId, 'Hello World')
    })

    expect(result.current.stickies[0].text).toBe('Hello World')
  })

  it('should update sticky position', () => {
    const { result } = renderHook(() => useStickyStore())
    
    act(() => {
      result.current.addSticky(100, 200)
    })

    const stickyId = result.current.stickies[0].id

    act(() => {
      result.current.updateStickyPosition(stickyId, 300, 400)
    })

    expect(result.current.stickies[0]).toMatchObject({
      x: 300,
      y: 400
    })
  })

  it('should delete a sticky', () => {
    const { result } = renderHook(() => useStickyStore())
    
    act(() => {
      result.current.addSticky(100, 200)
    })

    const stickyId = result.current.stickies[0].id

    act(() => {
      result.current.deleteSticky(stickyId)
    })

    expect(result.current.stickies).toHaveLength(0)
  })

  it('should clear all stickies', () => {
    const { result } = renderHook(() => useStickyStore())
    
    act(() => {
      result.current.addSticky(100, 200)
      result.current.addSticky(300, 400)
    })

    expect(result.current.stickies).toHaveLength(2)

    act(() => {
      result.current.clearAll()
    })

    expect(result.current.stickies).toHaveLength(0)
  })

  it('should delete multiple stickies', () => {
    const { result } = renderHook(() => useStickyStore())
    
    act(() => {
      result.current.addSticky(100, 200)
      result.current.addSticky(300, 400)
      result.current.addSticky(500, 600)
    })

    expect(result.current.stickies).toHaveLength(3)
    const idsToDelete = [result.current.stickies[0].id, result.current.stickies[2].id]

    act(() => {
      result.current.deleteMultiple(idsToDelete)
    })

    expect(result.current.stickies).toHaveLength(1)
    expect(result.current.stickies[0].x).toBe(300)
    expect(result.current.stickies[0].y).toBe(400)
  })
})
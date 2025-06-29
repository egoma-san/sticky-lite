import { debounce, throttle } from '../../app/features/sticky-notes/utils/timing'

// Mock timers
jest.useFakeTimers()

describe('timing utilities', () => {
  describe('debounce', () => {
    it('should delay function execution', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      // Call multiple times
      debouncedFn('first')
      debouncedFn('second')
      debouncedFn('third')

      // Function should not be called yet
      expect(mockFn).not.toHaveBeenCalled()

      // Fast forward time
      jest.advanceTimersByTime(100)

      // Function should be called only once with last arguments
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('third')
    })

    it('should cancel previous calls when called again', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('first')
      jest.advanceTimersByTime(50)
      
      debouncedFn('second')
      jest.advanceTimersByTime(50)
      
      // First call should be cancelled
      expect(mockFn).not.toHaveBeenCalled()
      
      jest.advanceTimersByTime(50)
      
      // Only second call should execute
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('second')
    })
  })

  describe('throttle', () => {
    it('should limit function calls to specified interval', () => {
      const mockFn = jest.fn()
      const throttledFn = throttle(mockFn, 100)

      // First call should execute immediately
      throttledFn('first')
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('first')

      // Subsequent calls within interval should be throttled
      throttledFn('second')
      throttledFn('third')
      expect(mockFn).toHaveBeenCalledTimes(1)

      // After interval, last call should execute
      jest.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledTimes(2)
      expect(mockFn).toHaveBeenCalledWith('third')
    })

    it('should execute first call immediately', () => {
      const mockFn = jest.fn()
      const throttledFn = throttle(mockFn, 100)

      throttledFn('immediate')
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('immediate')
    })

    it('should handle multiple throttle periods', () => {
      const mockFn = jest.fn()
      const throttledFn = throttle(mockFn, 100)

      // First period
      throttledFn('1-first')
      throttledFn('1-second')
      
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('1-first')

      jest.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledTimes(2)
      expect(mockFn).toHaveBeenCalledWith('1-second')

      // Second period
      throttledFn('2-first')
      throttledFn('2-second')
      
      expect(mockFn).toHaveBeenCalledTimes(3)
      expect(mockFn).toHaveBeenCalledWith('2-first')

      jest.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledTimes(4)
      expect(mockFn).toHaveBeenCalledWith('2-second')
    })
  })
})
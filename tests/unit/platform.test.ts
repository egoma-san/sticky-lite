import { isModifierKeyPressed, isMacOS, isIOS, isTouchDevice } from '../../app/features/sticky-notes/utils/platform'

describe('platform utilities', () => {
  describe('isModifierKeyPressed', () => {
    it('should detect meta key', () => {
      const event = {
        metaKey: true,
        ctrlKey: false
      } as any
      
      expect(isModifierKeyPressed(event)).toBe(true)
    })

    it('should detect ctrl key', () => {
      const event = {
        metaKey: false,
        ctrlKey: true
      } as any
      
      expect(isModifierKeyPressed(event)).toBe(true)
    })

    it('should return false when no modifier pressed', () => {
      const event = {
        metaKey: false,
        ctrlKey: false
      } as any
      
      expect(isModifierKeyPressed(event)).toBe(false)
    })
  })

  describe('isMacOS', () => {
    it('should return a boolean', () => {
      expect(typeof isMacOS()).toBe('boolean')
    })
  })

  describe('isIOS', () => {
    it('should return a boolean', () => {
      expect(typeof isIOS()).toBe('boolean')
    })
  })

  describe('isTouchDevice', () => {
    it('should return a boolean', () => {
      expect(typeof isTouchDevice()).toBe('boolean')
    })
  })
})
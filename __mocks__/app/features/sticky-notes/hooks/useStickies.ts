export const useStickies = jest.fn(() => ({
  stickies: [],
  selectedColor: 'yellow',
  isLoading: false,
  error: null,
  setSelectedColor: jest.fn(),
  addSticky: jest.fn(),
  updateStickyText: jest.fn(),
  updateStickyPosition: jest.fn(),
  updateStickySize: jest.fn(),
  updateStickyFontSize: jest.fn(),
  updateStickyFormat: jest.fn(),
  deleteSticky: jest.fn(),
  deleteMultiple: jest.fn(),
  clearAll: jest.fn(),
  clearError: jest.fn()
}))
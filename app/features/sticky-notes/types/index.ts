export type StickyColor = 'yellow' | 'blue' | 'pink'

export interface Sticky {
  id: string
  x: number
  y: number
  text: string
  color: StickyColor
  size?: number // Size multiplier, default is 1
  createdAt: Date
}

export interface StickyStore {
  stickies: Sticky[]
  selectedColor: StickyColor
  setSelectedColor: (color: StickyColor) => void
  addSticky: (x: number, y: number, color?: StickyColor) => void
  updateStickyText: (id: string, text: string) => void
  updateStickyPosition: (id: string, x: number, y: number) => void
  updateStickySize: (id: string, size: number) => void
  deleteSticky: (id: string) => void
  deleteMultiple: (ids: string[]) => void
  clearAll: () => void
}
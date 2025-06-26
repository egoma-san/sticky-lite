export interface Sticky {
  id: string
  x: number
  y: number
  text: string
  createdAt: Date
}

export interface StickyStore {
  stickies: Sticky[]
  addSticky: (x: number, y: number) => void
  updateStickyText: (id: string, text: string) => void
  updateStickyPosition: (id: string, x: number, y: number) => void
  deleteSticky: (id: string) => void
  deleteMultiple: (ids: string[]) => void
  clearAll: () => void
}
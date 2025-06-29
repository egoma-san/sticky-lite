export type StickyColor = 'yellow' | 'blue' | 'pink' | 'green' | 'purple' | 'orange'

export interface Sticky {
  id: string
  x: number
  y: number
  text: string
  richText?: string // HTML content for rich text
  color: StickyColor
  size?: number // Size multiplier, default is 1
  fontSize?: number // Font size in pixels, default is 16
  isBold?: boolean // Deprecated - kept for backward compatibility
  isItalic?: boolean // Deprecated - kept for backward compatibility
  isUnderline?: boolean // Deprecated - kept for backward compatibility
  createdAt: Date
}

export interface StickyStore {
  stickies: Sticky[]
  selectedColor: StickyColor
  setSelectedColor: (color: StickyColor) => void
  addSticky: (x: number, y: number, color?: StickyColor) => void
  updateStickyText: (id: string, text: string, richText?: string) => void
  updateStickyPosition: (id: string, x: number, y: number) => void
  updateStickySize: (id: string, size: number) => void
  updateStickyColor: (id: string, color: StickyColor) => void
  updateStickyFontSize: (id: string, fontSize: number) => void
  updateStickyFormat: (id: string, format: { isBold?: boolean; isItalic?: boolean; isUnderline?: boolean }) => void
  deleteSticky: (id: string) => void
  deleteMultiple: (ids: string[]) => void
  clearAll: () => void
}
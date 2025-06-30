import { StickyColor } from '../sticky-notes/types'

export interface SnapshotSticky {
  id: string
  x: number
  y: number
  text: string
  richText?: string
  color: StickyColor
  size?: number
  fontSize?: number
  isBold?: boolean
  isItalic?: boolean
  isUnderline?: boolean
}

export interface Snapshot {
  id: string
  name: string
  description?: string
  stickies: SnapshotSticky[]
  createdAt: Date
  updatedAt?: Date
}

export interface SnapshotStore {
  snapshots: Snapshot[]
  isLoading: boolean
  error: string | null
  maxSnapshots: number
  
  // Actions
  saveSnapshot: (name: string, description?: string, stickies?: SnapshotSticky[]) => Promise<void>
  loadSnapshot: (snapshotId: string) => Promise<SnapshotSticky[] | null>
  deleteSnapshot: (snapshotId: string) => Promise<void>
  fetchSnapshots: () => Promise<void>
  clearError: () => void
}
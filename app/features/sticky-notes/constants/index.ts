// Board constants
export const CANVAS_SIZE = 10000
export const INITIAL_OFFSET = CANVAS_SIZE / 2
export const MIN_SCALE = 0.1
export const MAX_SCALE = 3
export const ZOOM_STEP = {
  IN: 1.2,
  OUT: 0.8,
  WHEEL_IN: 1.1,
  WHEEL_OUT: 0.9,
}

// Sticky note constants
export const STICKY_WIDTH = 192 // 48 * 4 (w-48 in tailwind = 12rem = 192px)
export const STICKY_HEIGHT = 192
export const STICKY_HALF_WIDTH = STICKY_WIDTH / 2
export const STICKY_HALF_HEIGHT = STICKY_HEIGHT / 2

// Animation durations
export const CRUMPLE_ANIMATION_DURATION = 300
export const TRASH_DELETE_DELAY = 100

// Interaction thresholds
export const DRAG_THRESHOLD = 5 // pixels
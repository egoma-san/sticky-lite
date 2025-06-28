// Sound utilities for realistic deletion effects

// Base64 encoded sounds (these would be actual sound files in production)
const PAPER_SOUNDS = {
  tear1: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYmLjo+UmJmbnp+ipqirrrCztLW5vr7Awc',
  tear2: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYmLjo+UmJmbnp+ipqirrrCztLW5vr7Awc',
  crumple1: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYmLjo+UmJmbnp+ipqirrrCztLW5vr7Awc',
  crumple2: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYmLjo+UmJmbnp+ipqirrrCztLW5vr7Awc',
  rustle: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYmLjo+UmJmbnp+ipqirrrCztLW5vr7Awc'
}

export function playPaperSound(type: 'peel' | 'crumple' = 'crumple') {
  try {
    let soundKey: string
    
    if (type === 'peel') {
      // For peeling effect, use tear sounds
      soundKey = Math.random() > 0.5 ? 'tear1' : 'tear2'
    } else {
      // For crumple effect, randomly choose between crumple sounds
      const crumpleSounds = ['crumple1', 'crumple2', 'rustle']
      soundKey = crumpleSounds[Math.floor(Math.random() * crumpleSounds.length)]
    }
    
    const audio = new Audio(PAPER_SOUNDS[soundKey as keyof typeof PAPER_SOUNDS])
    audio.volume = 0.4
    audio.playbackRate = 0.9 + Math.random() * 0.3 // Vary playback speed slightly
    audio.play().catch(() => {
      // Ignore audio errors
    })
  } catch (error) {
    // Ignore any errors
  }
}
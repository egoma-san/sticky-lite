// Platform detection utilities

export const isMac = () => {
  if (typeof window === 'undefined') return false
  return /Mac|iPod|iPhone|iPad/.test(window.navigator.platform)
}

export const isWindows = () => {
  if (typeof window === 'undefined') return false
  return /Win/.test(window.navigator.platform)
}

export const isMobile = () => {
  if (typeof window === 'undefined') return false
  // Check for touch capability and screen size
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const isSmallScreen = window.innerWidth <= 768
  // Check user agent for mobile devices
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
  return mobileRegex.test(navigator.userAgent) || (hasTouch && isSmallScreen)
}

export const isIPhone = () => {
  if (typeof window === 'undefined') return false
  return /iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

export const isIPad = () => {
  if (typeof window === 'undefined') return false
  return /iPad/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export const isIOS = () => {
  return isIPhone() || isIPad()
}

export const getModifierKey = () => {
  return isMac() ? 'Cmd' : 'Ctrl'
}

export const isModifierKeyPressed = (event: KeyboardEvent | React.KeyboardEvent | MouseEvent | React.MouseEvent | WheelEvent | React.WheelEvent) => {
  return isMac() ? event.metaKey : event.ctrlKey
}

export const formatShortcut = (keys: string) => {
  const modifier = getModifierKey()
  return keys.replace(/Ctrl\/Cmd/g, modifier)
}
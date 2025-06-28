// Platform detection utilities

export const isMac = () => {
  if (typeof window === 'undefined') return false
  return /Mac|iPod|iPhone|iPad/.test(window.navigator.platform)
}

export const isWindows = () => {
  if (typeof window === 'undefined') return false
  return /Win/.test(window.navigator.platform)
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
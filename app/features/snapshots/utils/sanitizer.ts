import DOMPurify from 'isomorphic-dompurify'
import { SnapshotSticky } from '../types'

// Allowed HTML tags for rich text
const ALLOWED_TAGS = ['b', 'i', 'u', 'br', 'strong', 'em', 'span']
const ALLOWED_ATTR = ['style']

// Allowed CSS properties
const ALLOWED_STYLES = ['font-weight', 'font-style', 'text-decoration', 'color']

/**
 * Sanitize a single sticky note data
 */
export function sanitizeSticky(sticky: any): SnapshotSticky {
  // Ensure required fields
  if (!sticky || typeof sticky !== 'object') {
    throw new Error('Invalid sticky data')
  }
  
  // Check for required fields
  if (!('x' in sticky) || !('y' in sticky)) {
    throw new Error('Missing required fields')
  }
  
  // Sanitize and validate each field
  const sanitized: SnapshotSticky = {
    id: String(sticky.id || '').substring(0, 100).replace(/[<>]/g, ''), // Remove < > and limit length
    x: Number(sticky.x) || 0,
    y: Number(sticky.y) || 0,
    text: String(sticky.text || '').substring(0, 5000), // Limit text length
    color: validateColor(sticky.color),
    size: validateSize(sticky.size),
    fontSize: validateFontSize(sticky.fontSize),
    isBold: Boolean(sticky.isBold),
    isItalic: Boolean(sticky.isItalic),
    isUnderline: Boolean(sticky.isUnderline)
  }
  
  // Sanitize rich text if present
  if (sticky.richText) {
    sanitized.richText = sanitizeRichText(sticky.richText)
  }
  
  return sanitized
}

/**
 * Sanitize an array of stickies
 */
export function sanitizeStickies(stickies: any[]): SnapshotSticky[] {
  if (!Array.isArray(stickies)) {
    return []
  }
  
  // Limit number of stickies to prevent DoS
  const maxStickies = 1000
  const limitedStickies = stickies.slice(0, maxStickies)
  
  return limitedStickies.map(sticky => {
    try {
      return sanitizeSticky(sticky)
    } catch (error) {
      console.error('Failed to sanitize sticky:', error)
      return null
    }
  }).filter(Boolean) as SnapshotSticky[]
}

/**
 * Sanitize rich text content
 */
function sanitizeRichText(richText: string): string {
  if (typeof richText !== 'string') {
    return ''
  }
  
  // Configure DOMPurify
  const config = {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_STYLES,
    KEEP_CONTENT: true,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'link'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'href', 'src']
  }
  
  // Sanitize HTML
  const clean = DOMPurify.sanitize(richText, config)
  
  // Additional validation: limit length
  return clean.substring(0, 10000)
}

/**
 * Validate color value
 */
function validateColor(color: any): any {
  const validColors = ['yellow', 'blue', 'pink', 'green', 'purple', 'orange']
  return validColors.includes(color) ? color : 'yellow'
}

/**
 * Validate size value
 */
function validateSize(size: any): number {
  const numSize = Number(size)
  if (isNaN(numSize)) return 1
  return Math.max(0.5, Math.min(3, numSize))
}

/**
 * Validate font size
 */
function validateFontSize(fontSize: any): number {
  const numSize = Number(fontSize)
  if (isNaN(numSize)) return 16
  return Math.max(10, Math.min(64, numSize))
}

/**
 * Sanitize snapshot metadata
 */
export function sanitizeSnapshotMetadata(name: string, description?: string) {
  return {
    name: String(name).substring(0, 100).trim() || 'Untitled Snapshot',
    description: description ? String(description).substring(0, 500).trim() : undefined
  }
}
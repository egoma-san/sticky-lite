import { Sticky, StickyColor } from '../types'

// CSV headers
const CSV_HEADERS = ['id', 'text', 'richText', 'x', 'y', 'color', 'size', 'fontSize', 'isBold', 'isItalic', 'isUnderline', 'createdAt', 'updatedAt']

// Escape CSV value
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) return ''
  
  const stringValue = String(value)
  
  // If contains comma, newline, or double quote, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  
  return stringValue
}

// Parse CSV value
function parseCSVValue(value: string): string {
  value = value.trim()
  
  // Remove surrounding quotes if present
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1)
    // Unescape double quotes
    value = value.replace(/""/g, '"')
  }
  
  return value
}

// Export stickies to CSV
export function exportToCSV(stickies: Sticky[]): string {
  // Create header row
  const headers = CSV_HEADERS.join(',')
  
  // Create data rows
  const rows = stickies.map(sticky => {
    return CSV_HEADERS.map(header => {
      const value = sticky[header as keyof Sticky]
      return escapeCSVValue(value)
    }).join(',')
  })
  
  // Combine headers and rows
  return [headers, ...rows].join('\n')
}

// Download CSV file
export function downloadCSV(csvContent: string, filename: string = 'sticky-notes.csv') {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    // Create a link to the file
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

// Parse CSV line respecting quotes
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  // Add last field
  result.push(current)
  
  return result.map(field => parseCSVValue(field))
}

// Import stickies from CSV
export function importFromCSV(csvContent: string): Sticky[] {
  const lines = csvContent.trim().split('\n')
  
  if (lines.length < 2) {
    throw new Error('CSV file must contain headers and at least one data row')
  }
  
  // Parse headers
  const headers = parseCSVLine(lines[0])
  
  // Validate required headers
  const requiredHeaders = ['text', 'x', 'y']
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`)
  }
  
  // Parse data rows
  const stickies: Sticky[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue // Skip empty lines
    
    const values = parseCSVLine(line)
    
    if (values.length !== headers.length) {
      console.warn(`Line ${i + 1} has ${values.length} values but expected ${headers.length}. Skipping.`)
      continue
    }
    
    // Create sticky object
    const stickyData: any = {}
    
    headers.forEach((header, index) => {
      const value = values[index]
      
      // Parse different types
      switch (header) {
        case 'x':
        case 'y':
        case 'size':
        case 'fontSize':
          stickyData[header] = parseFloat(value) || 0
          break
          
        case 'isBold':
        case 'isItalic':
        case 'isUnderline':
          stickyData[header] = value.toLowerCase() === 'true'
          break
          
        case 'color':
          // Validate color
          const validColors: StickyColor[] = ['yellow', 'blue', 'pink', 'green', 'purple', 'orange']
          stickyData[header] = validColors.includes(value as StickyColor) ? value : 'yellow'
          break
          
        case 'createdAt':
        case 'updatedAt':
          // Parse date or use current date
          const date = value ? new Date(value) : new Date()
          stickyData[header] = isNaN(date.getTime()) ? new Date() : date
          break
          
        default:
          stickyData[header] = value
      }
    })
    
    // Generate new ID if not provided or if importing to avoid conflicts
    if (!stickyData.id) {
      stickyData.id = `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    } else {
      // Prefix imported IDs to avoid conflicts
      stickyData.id = `imported-${stickyData.id}`
    }
    
    // Ensure required fields
    if (!stickyData.text) stickyData.text = ''
    if (!stickyData.color) stickyData.color = 'yellow'
    if (stickyData.size === undefined) stickyData.size = 1
    if (stickyData.fontSize === undefined) stickyData.fontSize = 16
    if (!stickyData.createdAt) stickyData.createdAt = new Date()
    if (!stickyData.updatedAt) stickyData.updatedAt = new Date()
    
    stickies.push(stickyData as Sticky)
  }
  
  return stickies
}

// Read file as text
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsText(file)
  })
}
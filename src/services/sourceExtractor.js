import { extractTextFromPDF } from './pdf'
import { extractTextFromImage } from './ocr'

export async function extractFromFile(file) {
  const isPDF = file.type === 'application/pdf'
  const isImage = file.type.startsWith('image/')
  const isDocx = file.name.endsWith('.docx')
  const isText = file.type === 'text/plain' || file.name.endsWith('.txt')

  if (isPDF) {
    const text = await extractTextFromPDF(file)
    return { text, type: 'pdf' }
  }

  if (isImage) {
    const text = await extractTextFromImage(file, () => {})
    return { text, type: 'image' }
  }

  if (isDocx) {
    const mammoth = await import('mammoth')
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    return { text: result.value, type: 'docx' }
  }

  if (isText) {
    const text = await file.text()
    return { text, type: 'text' }
  }

  throw new Error(`Unsupported file type: ${file.type}`)
}

export async function extractFromURL(url) {
  try {
    // Use a CORS proxy for URL fetching
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
    const response = await fetch(proxyUrl)
    const data = await response.json()

    if (!data.contents) throw new Error('Could not fetch URL content')

    // Strip HTML tags and clean up
    const text = data.contents
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    return { text, type: 'url' }
  } catch (err) {
    throw new Error(`Failed to fetch URL: ${err.message}`)
  }
}

export function generateSourceId() {
  return `src_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export function getSourceIcon(type) {
  const icons = {
    pdf: '📄',
    image: '🖼',
    docx: '📝',
    text: '📃',
    url: '🔗',
    paste: '📋',
  }
  return icons[type] || '📄'
}

export function truncateText(text, maxLength = 50000) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '\n\n[Content truncated for processing...]'
}
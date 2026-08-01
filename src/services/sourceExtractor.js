import { extractTextFromPDF } from './pdf'
import { extractTextFromImage } from './ocr'

function cleanExtractedText(text) {
  return text
    // Fix spaced LaTeX commands
    .replace(/\\([a-z])\s+([a-z])\s+([a-z])\s+([a-z])/gi, '\\$1$2$3$4')
    .replace(/\\([a-z])\s+([a-z])\s+([a-z])/gi, '\\$1$2$3')
    .replace(/\\([a-z])\s+([a-z])/gi, '\\$1$2')
    // Fix common broken commands
    .replace(/\\f\s*r\s*a\s*c/g, '\\frac')
    .replace(/\\o\s*m\s*e\s*g\s*a/g, '\\omega')
    .replace(/\\a\s*l\s*p\s*h\s*a/g, '\\alpha')
    .replace(/\\b\s*e\s*t\s*a/g, '\\beta')
    .replace(/\\g\s*a\s*m\s*m\s*a/g, '\\gamma')
    .replace(/\\p\s*s\s*i/g, '\\psi')
    .replace(/\\h\s*b\s*a\s*r/g, '\\hbar')
    .replace(/\\n\s*a\s*b\s*l\s*a/g, '\\nabla')
    .replace(/\\p\s*a\s*r\s*t\s*i\s*a\s*l/g, '\\partial')
    .replace(/\\i\s*n\s*f\s*t\s*y/g, '\\infty')
    .replace(/\\s\s*q\s*r\s*t/g, '\\sqrt')
    .replace(/\\s\s*u\s*m/g, '\\sum')
    .replace(/\\i\s*n\s*t/g, '\\int')
    .replace(/\\l\s*a\s*m\s*b\s*d\s*a/g, '\\lambda')
    .replace(/\\s\s*i\s*g\s*m\s*a/g, '\\sigma')
    .replace(/\\p\s*i/g, '\\pi')
    .replace(/\\t\s*h\s*e\s*t\s*a/g, '\\theta')
    .replace(/\\m\s*u/g, '\\mu')
    // Fix ¶si → ψ (psi)
    .replace(/¶si/g, 'ψ')
    .replace(/¶/g, 'ψ')
}

export async function extractFromFile(file) {
  const isPDF = file.type === 'application/pdf'
  const isImage = file.type.startsWith('image/')
  const isDocx = file.name.endsWith('.docx')
  const isText = file.type === 'text/plain' || file.name.endsWith('.txt')

  if (isPDF) {
    const text = await extractTextFromPDF(file)
    return { text: cleanExtractedText(text), type: 'pdf' }
  }

  if (isImage) {
    const text = await extractTextFromImage(file, () => {})
    return { text: cleanExtractedText(text), type: 'image' }
  }

  if (isDocx) {
    const mammoth = await import('mammoth')
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    return { text: cleanExtractedText(result.value), type: 'docx' }
  }

  if (isText) {
    const text = await file.text()
    return { text: cleanExtractedText(text), type: 'text' }
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
    pdf: '',
    image: '',
    docx: '',
    text: '',
    url: '',
    paste: '',
    web: '',
  }
  return icons[type] || ''
}

export function truncateText(text, maxLength = 50000) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '\n\n[Content truncated for processing...]'
}
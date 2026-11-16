const MAX_BYTES = 900 * 1024
const MAX_SIDE = 2200

function endpoint() {
  return '/api/ocr'
}

async function shrinkImage(file) {
  if (file.size <= MAX_BYTES && /jpe?g/.test(file.type)) return file

  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  let scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  let quality = 0.85

  for (let i = 0; i < 8; i++) {
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', quality))
    if (blob && blob.size <= MAX_BYTES) {
      return new File([blob], 'scan.jpg', { type: 'image/jpeg' })
    }
    scale *= 0.85
    quality = Math.max(0.5, quality - 0.08)
  }
  throw new Error('Image is too large to process. Try a smaller photo.')
}

async function runOcr(file, engine) {
  const form = new FormData()
  form.append('file', file)
  form.append('language', 'eng')
  form.append('OCREngine', String(engine))
  form.append('scale', 'true')
  form.append('detectOrientation', 'true')
  form.append('isOverlayRequired', 'false')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30000)

  try {
    const res = await fetch(endpoint(), { method: 'POST', body: form, signal: controller.signal })
    const data = await res.json().catch(() => null)
    if (!data) throw new Error(`OCR service returned ${res.status}`)

    if (!res.ok || data.IsErroredOnProcessing === true || data.IsErroredOnProcessing === 'true') {
      const msg = Array.isArray(data.ErrorMessage) ? data.ErrorMessage.join(' ') : data.ErrorMessage
      throw new Error(msg || data.error || `OCR service returned ${res.status}`)
    }

    return (data.ParsedResults || [])
      .map((r) => r.ParsedText || '')
      .join('\n')
      .replace(/\r\n/g, '\n')
      .trim()
  } finally {
    clearTimeout(timer)
  }
}

export async function extractTextFromImage(file, onProgress) {
  onProgress?.(10)
  const small = await shrinkImage(file)
  onProgress?.(35)

  let text = ''
  let lastError = null

  for (const engine of [2, 1]) {
    try {
      text = await runOcr(small, engine)
      if (text.length > 3) break
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('OCR took too long. Try a smaller or clearer image.')
      }
      lastError = err
      if (engine === 2 && !/no readable text|no text/i.test(err.message)) throw err
    }
    onProgress?.(engine === 2 ? 65 : 90)
  }

  onProgress?.(100)
  if (!text) {
    throw lastError || new Error('No readable text found. Try a clearer, well-lit photo.')
  }
  return text
}
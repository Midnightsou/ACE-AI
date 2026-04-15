export async function extractTextFromImage(file, onProgress) {
  const apiKey = import.meta.env.VITE_OCR_SPACE_API_KEY

  onProgress?.(10)

  const formData = new FormData()
  formData.append('file', file)
  formData.append('apikey', apiKey)
  formData.append('language', 'eng')
  formData.append('isOverlayRequired', 'false')
  formData.append('detectOrientation', 'true')
  formData.append('scale', 'true')
  formData.append('OCREngine', '2')

  onProgress?.(40)

  const response = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    body: formData,
  })

  onProgress?.(80)

  const data = await response.json()

  if (data.IsErroredOnProcessing) {
    throw new Error(data.ErrorMessage?.[0] || 'OCR processing failed')
  }

  const text = data.ParsedResults
    ?.map((r) => r.ParsedText)
    .join('\n')
    .trim()

  onProgress?.(100)

  if (!text) throw new Error('No text found in image')

  return text
}
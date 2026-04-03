import Tesseract from 'tesseract.js'

export async function extractTextFromImage(file, onProgress) {
  const result = await Tesseract.recognize(file, 'eng', {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.floor(m.progress * 100))
      }
    },
  })

  return result.data.text.trim()
}
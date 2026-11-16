const MAX_INLINE_BYTES = 3 * 1024 * 1024
const MAX_IMAGE_SIDE = 4096
const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('Could not read the selected image.'))
    }
    reader.onerror = () => reject(new Error('Could not read the selected image.'))
    reader.readAsDataURL(file)
  })
}

async function prepareImage(file) {
  if (SUPPORTED_TYPES.has(file.type.toLowerCase()) && file.size <= MAX_INLINE_BYTES) {
    return file
  }

  let bitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new Error('This image format is not supported. Please use JPEG, PNG, GIF, or WebP.')
  }

  try {
    let scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height))
    for (let attempt = 0; attempt < 8; attempt++) {
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(bitmap.width * scale))
      canvas.height = Math.max(1, Math.round(bitmap.height * scale))
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Could not prepare this image for analysis.')

      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

      const quality = Math.max(0.58, 0.9 - attempt * 0.045)
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (result) => result ? resolve(result) : reject(new Error('Could not compress this image.')),
          'image/jpeg',
          quality,
        )
      })

      if (blob.size <= MAX_INLINE_BYTES) {
        return new File([blob], 'image-for-analysis.jpg', { type: 'image/jpeg' })
      }

      scale *= 0.85
    }
  } finally {
    bitmap.close()
  }

  throw new Error('This image is too large to analyze. Please choose a smaller image.')
}

export async function imageToDataUrl(file) {
  return readAsDataUrl(await prepareImage(file))
}

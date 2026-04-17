import { useRef, useState } from 'react'
import { extractTextFromPDF } from '../../services/pdf'
import { extractTextFromImage } from '../../services/ocr'

export default function FileUpload({ onExtracted, disabled }) {
  const inputRef = useRef(null)
  const [processing, setProcessing] = useState(false)

  async function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return

    const isPDF = file.type === 'application/pdf'
    const isImage = file.type.startsWith('image/')

    if (!isPDF && !isImage) {
      alert('Only PDF and image files are supported.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Max 10MB.')
      return
    }

    setProcessing(true)

    try {
      if (isPDF) {
        const text = await extractTextFromPDF(file)
        if (!text || text.length < 10) {
          alert('Could not extract text from this PDF.')
          return
        }
        onExtracted({ type: 'pdf', name: file.name, content: text })
      } else {
        const text = await extractTextFromImage(file)
        if (!text || text.length < 5) {
          alert('Could not read text from this image. Make sure it is clear and well-lit.')
          return
        }
        const previewUrl = URL.createObjectURL(file)
        onExtracted({ type: 'image', name: file.name, content: text, previewUrl })
      }
    } catch (err) {
      console.error('File processing error:', err)
      alert(`Failed to process file: ${err.message}`)
    } finally {
      setProcessing(false)
      e.target.value = ''
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || processing}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || processing}
        className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-violet-600 transition-colors disabled:opacity-40"
        title="Upload PDF or image"
      >
        {processing ? (
          <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.41 17.41a2 2 0 01-2.83-2.83l8.49-8.48"/>
          </svg>
        )}
      </button>
    </>
  )
}
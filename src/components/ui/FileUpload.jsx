import { useRef, useState } from 'react'
import { extractTextFromPDF } from '../../services/pdf'
import { extractTextFromImage } from '../../services/ocr'

export default function FileUpload({ onExtracted, disabled }) {
  const inputRef = useRef(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

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
      alert('File is too large. Max size is 10MB.')
      return
    }

    setProcessing(true)
    setProgress(0)

    try {
      if (isPDF) {
        const text = await extractTextFromPDF(file)
        if (!text || text.length < 10) {
          alert('Could not extract text from this PDF. It may be a scanned image-based PDF — try uploading it as an image instead.')
          return
        }
        onExtracted({
          type: 'pdf',
          name: file.name,
          content: text,
        })
      } else {
        // Create preview URL for the image
        const previewUrl = URL.createObjectURL(file)

        const text = await extractTextFromImage(file, (pct) => {
          setProgress(pct)
        })

        if (!text || text.length < 5) {
          alert('Could not read text from this image. Make sure the image is clear and well-lit.')
          URL.revokeObjectURL(previewUrl)
          return
        }

        onExtracted({
          type: 'image',
          name: file.name,
          content: text,
          previewUrl,
        })
      }
    } catch (err) {
      console.error('File processing error:', err)
      alert('Failed to process file. Try again.')
    } finally {
      setProcessing(false)
      setProgress(0)
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
        className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-violet-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed relative"
        title={processing ? `Processing... ${progress}%` : 'Upload PDF or image'}
      >
        {processing ? (
          <div className="relative w-5 h-5">
            <svg className="w-5 h-5 -rotate-90" viewBox="0 0 20 20">
              <circle
                cx="10" cy="10" r="8"
                fill="none"
                stroke="#e4e4e7"
                strokeWidth="2"
              />
              <circle
                cx="10" cy="10" r="8"
                fill="none"
                stroke="#7c3aed"
                strokeWidth="2"
                strokeDasharray={`${(progress / 100) * 50.3} 50.3`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-violet-600">
              {progress}
            </span>
          </div>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.41 17.41a2 2 0 01-2.83-2.83l8.49-8.48"/>
          </svg>
        )}
      </button>
    </>
  )
}
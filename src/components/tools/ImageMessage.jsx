import { useState } from 'react'
import { stylePresets } from '../../prompts/tools/imagePrompt'

export default function ImageMessage({ message, onRegenerate, onVariation }) {
  const [downloading, setDownloading] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  if (message.role === 'user') {
    const styleLabel = stylePresets.find((s) => s.id === message.style)?.label
    return (
      <div className="flex justify-end mb-4">
        <div className="flex flex-col items-end gap-1">
          <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed bg-violet-600 text-white">
            {message.content}
          </div>
          {styleLabel && styleLabel !== 'None' && (
            <span className="text-xs text-zinc-400 mr-1">{styleLabel} style</span>
          )}
        </div>
      </div>
    )
  }

  if (message.type === 'error') {
    return (
      <div className="flex justify-start mb-4">
        <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
          <span className="text-violet-600 text-sm">🎨</span>
        </div>
        <div className="bg-red-50 border border-red-100 px-4 py-3 rounded-2xl text-sm text-red-600">
          {message.content}
        </div>
      </div>
    )
  }

  async function handleDownload() {
    setDownloading(true)
    try {
      const response = await fetch(message.imageUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ace-image-${message.seed}.png`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      window.open(message.imageUrl, '_blank')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex justify-start mb-4">
      <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
        <span className="text-violet-600 text-sm">🎨</span>
      </div>
      <div className="flex flex-col gap-2 max-w-sm">

        {/* Image */}
        <div className="relative rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <img
            src={message.imageUrl}
            alt={message.originalPrompt}
            className={`w-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            style={{
              aspectRatio: `${message.width}/${message.height}`,
              maxHeight: '400px',
            }}
            onLoad={() => setImageLoaded(true)}
          />
        </div>

        {/* Actions */}
        {imageLoaded && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              {downloading ? 'Saving...' : 'Download'}
            </button>
            <button
              onClick={() => onRegenerate?.(message.originalPrompt, message.style, message.width, message.height)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-600 text-xs font-medium rounded-lg transition-colors"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M23 4v6h-6M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
              Regenerate
            </button>
            <button
              onClick={() => onVariation?.(message.originalPrompt, message.style, message.width, message.height)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-600 text-xs font-medium rounded-lg transition-colors"
            >
              ✨ Variation
            </button>
          </div>
        )}

        {/* Prompt used */}
        {imageLoaded && message.prompt !== message.originalPrompt && (
          <details className="text-xs">
            <summary className="text-zinc-400 cursor-pointer hover:text-zinc-600">
              Enhanced prompt
            </summary>
            <p className="text-zinc-500 mt-1 leading-relaxed pl-2 border-l border-zinc-200">
              {message.prompt}
            </p>
          </details>
        )}
      </div>
    </div>
  )
}
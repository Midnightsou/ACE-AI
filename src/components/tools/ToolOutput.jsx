import { useState } from 'react'

export default function ToolOutput({ content, streaming, label = 'Output', filename = 'output.txt' }) {
  const [copied, setCopied] = useState(false)

  if (!content && !streaming) return null

  async function handleCopy() {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
        {content && !streaming && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="text-xs text-zinc-400 hover:text-violet-600 transition-colors flex items-center gap-1"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              Download
            </button>
            <button
              onClick={handleCopy}
              className="text-xs text-zinc-400 hover:text-violet-600 transition-colors flex items-center gap-1"
            >
              {copied ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="9" y="9" width="13" height="13" rx="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border border-zinc-100 rounded-2xl p-5 shadow-sm text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap min-h-32">
        {content}
        {streaming && (
          <span className="inline-block w-1.5 h-4 bg-violet-500 ml-0.5 animate-pulse rounded-sm align-middle" />
        )}
      </div>
    </div>
  )
}
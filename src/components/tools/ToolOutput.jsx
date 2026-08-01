import { useState } from 'react'
import { downloadTextAsPDF } from '../../services/pdfExport'

export default function ToolOutput({ content, toolId, title }) {
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDownloadPDF() {
    if (!content) return
    setDownloading(true)
    try {
      await downloadTextAsPDF(content, `${title || toolId}-ace.pdf`)
    } finally {
      setDownloading(false)
    }
  }

  async function handleDownloadTXT() {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || toolId}-ace.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!content) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Output</p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-violet-600 transition-colors px-2 py-1"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
          <button
            onClick={handleDownloadTXT}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-violet-600 transition-colors px-2 py-1"
          >
            TXT
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center gap-1.5 text-xs bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white transition-colors px-3 py-1.5 rounded-lg"
          >
            {downloading ? 'Exporting...' : 'PDF'}
          </button>
        </div>
      </div>
      <div className="bg-white border border-zinc-100 rounded-2xl p-5 shadow-sm text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap">
        {content}
      </div>
    </div>
  )
}
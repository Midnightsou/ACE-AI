import { useState } from 'react'
import { useDojo } from '../../../hooks/useDojo'
import { buildReportPrompt } from '../../../prompts/tools/dojoPrompt'

export default function DojoReport() {
  const { generateContent, generatingTab, generatedContent, readySources } = useDojo()
  const [copied, setCopied] = useState(false)

  const content = generatedContent['report']
  const isGenerating = generatingTab === 'report'

  async function handleCopy() {
    if (!content) return
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    if (!content) return
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'dojo-report.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (readySources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
        <span className="text-3xl">📊</span>
        <p className="text-sm font-medium text-zinc-600">Add sources first</p>
        <p className="text-xs text-zinc-400 max-w-xs">Upload your sources then generate a professional research report.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-sm font-semibold text-zinc-800">📊 Research Report</p>
          <p className="text-xs text-zinc-400 mt-0.5">Professional synthesis of all sources</p>
        </div>
        {content && !isGenerating && (
          <div className="flex items-center gap-3">
            <button onClick={handleCopy} className="text-xs text-zinc-400 hover:text-violet-600 transition-colors">
              {copied ? '✓ Copied' : 'Copy'}
            </button>
            <button onClick={handleDownload} className="text-xs text-zinc-400 hover:text-violet-600 transition-colors">
              Download
            </button>
            <button
              onClick={() => generateContent('report', buildReportPrompt)}
              className="text-xs text-zinc-400 hover:text-violet-600 transition-colors"
            >
              Regenerate
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {!content && !isGenerating && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center text-2xl">📊</div>
            <div>
              <p className="text-sm font-medium text-zinc-700">Generate research report</p>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
                Ace synthesises all {readySources.length} source{readySources.length !== 1 ? 's' : ''} into a structured professional report with executive summary, findings, and recommendations.
              </p>
            </div>
            <button
              onClick={() => generateContent('report', buildReportPrompt)}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              <span>✨</span> Generate report
            </button>
          </div>
        )}

        {isGenerating && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 text-sm text-violet-700">
              <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              Writing research report from {readySources.length} sources...
            </div>
            {content && (
              <div className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap bg-white border border-zinc-100 rounded-2xl p-5 shadow-sm">
                {content}
                <span className="inline-block w-1.5 h-4 bg-violet-500 ml-0.5 animate-pulse rounded-sm align-middle" />
              </div>
            )}
          </div>
        )}

        {content && !isGenerating && (
          <div className="bg-white border border-zinc-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-zinc-50">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-medium">
                  Research Report
                </span>
                <span className="text-xs text-zinc-400">
                  {readySources.length} source{readySources.length !== 1 ? 's' : ''} analysed
                </span>
              </div>
            </div>
            <div className="px-8 py-6">
              {content.split('\n').map((line, i) => {
                if (!line.trim()) return <div key={i} className="h-3" />
                const isHeader = line.length < 60 &&
                  !line.startsWith('-') &&
                  (line === line.toUpperCase() || /^[A-Z][A-Z\s]+$/.test(line.trim()))

                return (
                  <p
                    key={i}
                    className={isHeader
                      ? 'text-sm font-bold text-zinc-900 mt-6 mb-2 uppercase tracking-wide'
                      : 'text-sm text-zinc-700 leading-relaxed mb-2'
                    }
                  >
                    {line}
                  </p>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
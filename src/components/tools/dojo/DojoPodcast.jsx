import { useState } from 'react'
import { useDojoStore } from '../../../store/dojoStore'
import { useDojo } from '../../../hooks/useDojo'
import { buildPodcastPrompt } from '../../../prompts/tools/dojoPrompt'
import { parsePodcastScript } from '../../../services/podcast'
import PodcastPlayer from './PodcastPlayer'

export default function DojoPodcast() {
  const { readySources, generateContent, generatingTab, generatedContent } = useDojo()
  const { podcastScript, setPodcastScript } = useDojoStore()

  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [playerReady, setPlayerReady] = useState(false)

  const script = podcastScript || generatedContent['podcast']
  const segments = script ? parsePodcastScript(script) : []

  async function handleGenerateScript() {
    setError(null)
    setPlayerReady(false)
    setGenerating(true)
    try {
      await generateContent('podcast', buildPodcastPrompt)
      const content = useDojoStore.getState().generatedContent['podcast']
      if (content) setPodcastScript(content)
    } catch (_err) {
      setError('Failed to generate podcast script. Try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleCopyScript() {
    if (!script) return
    await navigator.clipboard.writeText(script)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownloadScript() {
    if (!script) return
    const blob = new Blob([script], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'dojo-podcast-script.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (readySources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
        <span className="text-3xl">🎙</span>
        <p className="text-sm font-medium text-zinc-600">Add sources first</p>
        <p className="text-xs text-zinc-400 max-w-xs">
          Upload your content, then generate a podcast where two AI hosts discuss it naturally.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-sm font-semibold text-zinc-800">🎙 AI Podcast</p>
          <p className="text-xs text-zinc-400 mt-0.5">
            Alex and Sam discuss your sources naturally · Powered by browser voices
          </p>
        </div>
        {script && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyScript}
              className="text-xs text-zinc-400 hover:text-violet-600 transition-colors"
            >
              {copied ? '✓ Copied' : 'Copy script'}
            </button>
            <button
              onClick={handleDownloadScript}
              className="text-xs text-zinc-400 hover:text-violet-600 transition-colors"
            >
              Download
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* No script yet */}
        {!script && !generating && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center text-3xl">
              🎙
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-700">Generate a podcast</p>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
                Alex and Sam will have a natural conversation about your {readySources.length} source{readySources.length !== 1 ? 's' : ''}, making the content engaging and easy to understand.
              </p>
            </div>
            <button
              onClick={handleGenerateScript}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              <span>✨</span>
              Generate podcast script
            </button>
          </div>
        )}

        {/* Generating */}
        {(generating || generatingTab === 'podcast') && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 text-sm text-violet-700">
              <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              Writing podcast script...
            </div>
            {generatedContent['podcast'] && (
              <div className="text-xs text-zinc-600 leading-relaxed whitespace-pre-wrap bg-white border border-zinc-100 rounded-2xl p-4 shadow-sm font-mono max-h-48 overflow-y-auto">
                {generatedContent['podcast']}
                <span className="inline-block w-1.5 h-4 bg-violet-500 ml-0.5 animate-pulse rounded-sm align-middle" />
              </div>
            )}
          </div>
        )}

        {/* Script ready */}
        {script && !generating && (
          <div className="flex flex-col gap-5">

            {/* Segment preview */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Script — {segments.length} segments
                </p>
                <button
                  onClick={handleGenerateScript}
                  className="text-xs text-zinc-400 hover:text-violet-600 transition-colors"
                >
                  Regenerate
                </button>
              </div>

              <div className="bg-white border border-zinc-100 rounded-2xl p-4 shadow-sm max-h-40 overflow-y-auto">
                {segments.map((seg, i) => (
                  <div key={i} className="flex gap-3 mb-2">
                    <span className={`text-xs font-bold flex-shrink-0 w-8 ${seg.speaker === 'ALEX' ? 'text-violet-600' : 'text-zinc-500'}`}>
                      {seg.speaker === 'ALEX' ? 'Alex' : 'Sam'}
                    </span>
                    <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2">{seg.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Player */}
            {!playerReady ? (
              <button
                onClick={() => setPlayerReady(true)}
                className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-3"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}>
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Launch podcast player
              </button>
            ) : (
              <div className="bg-white border border-zinc-100 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                  Now playing
                </p>
                <PodcastPlayer segments={segments} />
              </div>
            )}

            <p className="text-xs text-zinc-400 text-center">
              
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
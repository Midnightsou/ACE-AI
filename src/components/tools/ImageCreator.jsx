import { useState, useRef, useEffect } from 'react'
import { useImageCreator } from '../../hooks/useImageCreator'
import ImageMessage from './ImageMessage'
import { stylePresets, aspectRatios } from '../../prompts/tools/imagePrompt'

const QUICK_PROMPTS = [
  'A futuristic Lagos skyline at sunset with flying cars',
  'A young African woman reading a glowing book in a magical forest',
  'A lion wearing a crown sitting on a golden throne',
  'Abstract representation of Nigerian culture and heritage',
  'A cyberpunk Abuja with neon lights and rain',
  'A peaceful village in Yorubaland at golden hour',
]

export default function ImageCreator() {
  const { messages, loading, enhancing, generate, regenerate, clearMessages } = useImageCreator()

  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('none')
  const [aspectRatio, setAspectRatio] = useState(aspectRatios[0])
  const [useEnhancer, setUseEnhancer] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleGenerate() {
    if (!prompt.trim() || loading) return
    const text = prompt.trim()
    setPrompt('')
    await generate({
      prompt: text,
      style,
      width: aspectRatio.width,
      height: aspectRatio.height,
      useEnhancer,
    })
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleGenerate()
    }
  }

  return (
    <div className="flex flex-col h-full bg-zinc-50">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-zinc-100 flex-shrink-0">
        <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm">🎨</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-zinc-900">Image Creator</p>
          <p className="text-xs text-zinc-400">Powered by Flux · Free · No limits</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 hover:bg-zinc-50 rounded-lg text-xs text-zinc-500 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            New
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 pb-16">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-pink-100 rounded-2xl flex items-center justify-center text-3xl">
              🎨
            </div>
            <div className="text-center">
              <p className="font-semibold text-zinc-800">Create any image</p>
              <p className="text-sm text-zinc-400 mt-1 max-w-xs">
                Describe what you want and Ace will generate it. Pick a style below for best results.
              </p>
            </div>
            <div className="w-full max-w-lg flex flex-col gap-2">
              <p className="text-xs text-zinc-400 text-center mb-1">Try these</p>
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPrompt(p)
                    inputRef.current?.focus()
                  }}
                  className="text-sm text-left px-4 py-3 bg-white border border-zinc-200 rounded-xl hover:border-violet-400 hover:bg-violet-50 transition-colors text-zinc-600 hover:text-violet-700"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <ImageMessage
            key={i}
            message={msg}
            onRegenerate={regenerate}
            onVariation={(p, s, w, h) => generate({ prompt: p, style: s, width: w, height: h, useEnhancer: true })}
          />
        ))}

        {/* Loading state */}
        {loading && (
  <div className="flex justify-start mb-4">
    <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
      <span className="text-violet-600 text-sm">🎨</span>
    </div>
    <div className="bg-white border border-zinc-100 shadow-sm px-4 py-4 rounded-2xl flex flex-col gap-2 max-w-xs">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
        <span className="text-sm text-zinc-600 font-medium">
          {enhancing ? 'Enhancing your prompt...' : 'Generating image...'}
        </span>
      </div>
      {!enhancing && (
        <p className="text-xs text-zinc-400 leading-relaxed">
          This can take 1–3 minutes depending on your connection. Please wait — your image is being created.
        </p>
      )}
    </div>
  </div>
)}

        <div ref={bottomRef} />
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="flex-shrink-0 px-4 pt-3 pb-1 bg-white border-t border-zinc-100">
          <div className="flex flex-col gap-3">

            {/* Style */}
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-zinc-500 font-medium">Style</p>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {stylePresets.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex-shrink-0
                      ${style === s.id
                        ? 'bg-violet-600 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect ratio + enhancer */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-zinc-500 font-medium">Ratio</p>
                <div className="flex gap-1.5">
                  {aspectRatios.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setAspectRatio(r)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors
                        ${aspectRatio.id === r.id
                          ? 'bg-violet-600 text-white'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer ml-auto">
                <div
                  onClick={() => setUseEnhancer((v) => !v)}
                  className={`w-8 h-4 rounded-full relative transition-colors flex-shrink-0 ${useEnhancer ? 'bg-violet-600' : 'bg-zinc-300'}`}
                >
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${useEnhancer ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-xs text-zinc-500">Enhance prompt</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-4 bg-white border-t border-zinc-100">

        {/* Style quick select when settings hidden */}
        {!showSettings && (
          <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1 scrollbar-hide">
            {stylePresets.slice(0, 8).map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex-shrink-0
                  ${style === s.id
                    ? 'bg-violet-600 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
              >
                {s.label}
              </button>
            ))}
            <button
              onClick={() => setShowSettings((v) => !v)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors flex-shrink-0 flex items-center gap-1"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/>
              </svg>
              More
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 focus-within:border-violet-400 transition-colors">
          <textarea
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the image you want to create..."
            disabled={loading}
            rows={1}
            className="flex-1 bg-transparent text-sm text-zinc-800 placeholder:text-zinc-400 outline-none resize-none max-h-32 py-1 disabled:opacity-50"
            style={{ scrollbarWidth: 'none' }}
          />

          {/* Settings toggle */}
          <button
            onClick={() => setShowSettings((v) => !v)}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${showSettings ? 'bg-violet-100 text-violet-600' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/>
            </svg>
          </button>

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-8 h-8 bg-gradient-to-br from-violet-600 to-pink-600 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-opacity flex-shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M22 2L11 13"/>
              <path d="M22 2L15 22 11 13 2 9l20-7z"/>
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-zinc-400">
            {style !== 'none' && (
              <span className="text-violet-500">{stylePresets.find(s => s.id === style)?.label} · </span>
            )}
            {aspectRatio.label}
          </p>
          {useEnhancer && (
            <p className="text-xs text-zinc-400">✨ Prompt enhancement on</p>
          )}
        </div>
      </div>
    </div>
  )
}
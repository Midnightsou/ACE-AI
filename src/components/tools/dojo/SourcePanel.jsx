import { useState, useRef } from 'react'
import { useDojoStore } from '../../../store/dojoStore'
import {
  extractFromFile,
  extractFromURL,
  generateSourceId,
  truncateText,
} from '../../../services/sourceExtractor'
import SourceCard from './SourceCard'

export default function SourcePanel() {
  const { sources, addSource, removeSource, clearSources } = useDojoStore()

  const [urlInput, setUrlInput] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [showPaste, setShowPaste] = useState(false)
  const [showURL, setShowURL] = useState(false)
  const [addingURL, setAddingURL] = useState(false)
  const fileInputRef = useRef(null)

  async function handleFileUpload(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return

    for (const file of files) {
      const id = generateSourceId()
      const source = {
        id,
        name: file.name,
        type: 'pdf',
        loading: true,
        preview: '',
        content: '',
        wordCount: 0,
        error: null,
      }
      addSource(source)

      try {
        const { text, type } = await extractFromFile(file)
        const preview = text.slice(0, 200).trim()
        const wordCount = text.trim().split(/\s+/).length

        const { useDojoStore: store } = await import('../../../store/dojoStore')
        store.getState().updateSource(id, {
          type,
          loading: false,
          content: truncateText(text),
          fullContent: text,
          preview,
          wordCount,
        })
      } catch (err) {
        const { useDojoStore: store } = await import('../../../store/dojoStore')
        store.getState().updateSource(id, {
          loading: false,
          error: err.message || 'Failed to extract content',
        })
      }
    }

    e.target.value = ''
  }

  async function handleAddURL() {
    if (!urlInput.trim()) return
    const url = urlInput.trim()
    setAddingURL(true)

    const id = generateSourceId()
    addSource({
      id,
      name: url,
      type: 'url',
      loading: true,
      preview: '',
      content: '',
      wordCount: 0,
      error: null,
    })

    setUrlInput('')
    setShowURL(false)

    try {
      const { text } = await extractFromURL(url)
      const preview = text.slice(0, 200).trim()
      const wordCount = text.trim().split(/\s+/).length

      const { useDojoStore: store } = await import('../../../store/dojoStore')
      store.getState().updateSource(id, {
        loading: false,
        content: truncateText(text),
        fullContent: text,
        preview,
        wordCount,
      })
    } catch (err) {
      const { useDojoStore: store } = await import('../../../store/dojoStore')
      store.getState().updateSource(id, {
        loading: false,
        error: err.message || 'Failed to fetch URL',
      })
    } finally {
      setAddingURL(false)
    }
  }

  function handleAddPaste() {
    if (!pasteText.trim()) return
    const id = generateSourceId()
    const preview = pasteText.slice(0, 200).trim()
    const wordCount = pasteText.trim().split(/\s+/).length
    addSource({
      id,
      name: `Pasted text (${wordCount} words)`,
      type: 'paste',
      loading: false,
      content: truncateText(pasteText),
      fullContent: pasteText,
      preview,
      wordCount,
      error: null,
    })
    setPasteText('')
    setShowPaste(false)
  }

  const totalWords = sources.reduce((sum, s) => sum + (s.wordCount || 0), 0)
  const readySources = sources.filter((s) => !s.loading && !s.error && s.content)

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-sm font-semibold text-zinc-800">Sources</p>
          <p className="text-xs text-zinc-400 mt-0.5">
            {sources.length === 0
              ? 'Add sources to get started'
              : `${readySources.length} source${readySources.length !== 1 ? 's' : ''} · ${totalWords.toLocaleString()} words`
            }
          </p>
        </div>
        {sources.length > 0 && (
          <button
            onClick={clearSources}
            className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Sources list */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">

        {sources.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-8">
            <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center text-2xl">
              📚
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-600">No sources yet</p>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
                Upload PDFs, paste text, or add URLs. Ace will read everything and answer your questions.
              </p>
            </div>
          </div>
        )}

        {sources.map((source, i) => (
          <SourceCard
            key={source.id}
            source={source}
            index={i}
            onRemove={removeSource}
          />
        ))}

        {/* URL input */}
        {showURL && (
          <div className="flex flex-col gap-2 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
            <p className="text-xs font-medium text-zinc-600">Add URL</p>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddURL()}
              placeholder="https://example.com/article"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:border-violet-500 transition-colors bg-white"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddURL}
                disabled={!urlInput.trim() || addingURL}
                className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors"
              >
                {addingURL ? 'Fetching...' : 'Add URL'}
              </button>
              <button
                onClick={() => { setShowURL(false); setUrlInput('') }}
                className="px-3 py-2 border border-zinc-200 text-zinc-500 text-xs rounded-lg hover:bg-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Paste text input */}
        {showPaste && (
          <div className="flex flex-col gap-2 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
            <p className="text-xs font-medium text-zinc-600">Paste text</p>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste any text, article, or notes here..."
              rows={6}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:border-violet-500 transition-colors resize-none bg-white"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddPaste}
                disabled={!pasteText.trim()}
                className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors"
              >
                Add text
              </button>
              <button
                onClick={() => { setShowPaste(false); setPasteText('') }}
                className="px-3 py-2 border border-zinc-200 text-zinc-500 text-xs rounded-lg hover:bg-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add source buttons */}
      <div className="p-4 border-t border-zinc-100 flex flex-col gap-2 flex-shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.docx,image/*"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center gap-3 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
          </svg>
          Upload files
          <span className="text-violet-300 text-xs ml-auto">PDF, DOCX, TXT, images</span>
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => { setShowURL((v) => !v); setShowPaste(false) }}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border rounded-xl text-sm transition-colors
              ${showURL ? 'border-violet-400 bg-violet-50 text-violet-700' : 'border-zinc-200 text-zinc-600 hover:border-violet-300'}`}
          >
            <span>🔗</span>
            Add URL
          </button>
          <button
            onClick={() => { setShowPaste((v) => !v); setShowURL(false) }}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border rounded-xl text-sm transition-colors
              ${showPaste ? 'border-violet-400 bg-violet-50 text-violet-700' : 'border-zinc-200 text-zinc-600 hover:border-violet-300'}`}
          >
            <span>📋</span>
            Paste text
          </button>
        </div>
      </div>
    </div>
  )
}
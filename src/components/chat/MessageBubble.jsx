import { memo, useState, useRef } from 'react'
import { useUserStore } from '../../store/userStore'

function SourceCard({ citation }) {
  return (
    <a
      href={citation.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 p-3 rounded-xl border border-zinc-100 hover:border-violet-300 hover:bg-violet-50 transition-all group cursor-pointer"
    >
      {/* Favicon */}
      <img
        src={`https://www.google.com/s2/favicons?domain=${citation.domain}&sz=16`}
        alt=""
        className="w-4 h-4 rounded mt-0.5 flex-shrink-0"
        onError={(e) => { e.target.style.display = 'none' }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-zinc-700 group-hover:text-violet-700 truncate transition-colors">
          {citation.title}
        </p>
        <p className="text-xs text-zinc-400 mt-0.5 truncate">{citation.domain}</p>
      </div>
      <svg className="w-3 h-3 text-zinc-300 group-hover:text-violet-400 flex-shrink-0 mt-0.5 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
        <polyline points="15 3 21 3 21 9"/>
        <line x1="10" y1="14" x2="21" y2="3"/>
      </svg>
    </a>
  )
}

function renderMessageContent(content) {
  if (!content) return null

  const dividerPattern = '━━━ Sources ━━━'
  const parts = content.split(dividerPattern)
  const mainText = parts[0].trim()
  const sourcesRaw = parts[1]

  // Parse inline citations [1], [2] etc from main text
  const renderWithInlineCitations = (text) => {
    const segments = text.split(/(\[\d+\])/g)
    return segments.map((seg, i) => {
      const match = seg.match(/^\[(\d+)\]$/)
      if (match) {
        return (
          <sup key={i} className="text-violet-500 font-medium text-xs cursor-default" title={`Source ${match[1]}`}>
            [{match[1]}]
          </sup>
        )
      }
      return <span key={i}>{seg}</span>
    })
  }

  // Parse sources block into structured citations
  const parseSources = (raw) => {
    if (!raw) return []
    const blocks = raw.trim().split('\n\n').filter(Boolean)
    return blocks.map((block) => {
      const lines = block.trim().split('\n')
      const titleLine = lines[0] || ''
      const urlLine = lines[1] || ''
      const titleMatch = titleLine.match(/^\[Source \d+\]\s*(.+)/)
      const title = titleMatch?.[1] || titleLine.replace(/^\[\d+\]\s*/, '')
      const url = urlLine.trim()
      if (!url.startsWith('http')) return null
      let domain = ''
      try { domain = new URL(url).hostname.replace('www.', '') } catch { /* ignore invalid URL */ }
      return { title, url, domain }
    }).filter(Boolean)
  }

  const citations = parseSources(sourcesRaw)

  return (
    <div>
      {/* Main response text with inline citation numbers */}
      <p className="text-sm leading-relaxed whitespace-pre-wrap">
        {renderWithInlineCitations(mainText)}
      </p>

      {/* Source cards */}
      {citations.length > 0 && (
        <div className="mt-4 pt-3 border-t border-zinc-100">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Sources
          </p>
          <div className="flex flex-col gap-1.5">
            {citations.map((c, i) => (
              <SourceCard key={i} citation={c} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const MessageBubble = memo(function MessageBubble({ message, index, onEdit }) {
  const user = useUserStore((s) => s.user)
  const isUser = message.role === 'user'
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(message.content)
  const textareaRef = useRef(null)

  function handleEditStart() {
    setEditText(message.content)
    setEditing(true)
    setTimeout(() => {
      textareaRef.current?.focus()
      textareaRef.current?.select()
    }, 50)
  }

  function handleEditSave() {
    if (!editText.trim()) return
    onEdit?.(index, editText.trim())
    setEditing(false)
  }

  function handleEditCancel() {
    setEditing(false)
    setEditText(message.content)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEditSave()
    }
    if (e.key === 'Escape') handleEditCancel()
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 group`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">
          A
        </div>
      )}

      <div className="flex flex-col items-end gap-1 max-w-[75%]">
        {editing ? (
          <div className="w-full flex flex-col gap-2">
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border-2 border-violet-400 text-sm text-zinc-800 outline-none resize-none bg-white"
              style={{ scrollbarWidth: 'none' }}
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={handleEditCancel}
                className="text-xs text-zinc-400 hover:text-zinc-600 px-3 py-1.5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={!editText.trim()}
                className="text-xs bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                Save & resend
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                ${isUser
                  ? 'bg-violet-600 text-white rounded-tr-sm'
                  : 'bg-white text-zinc-800 rounded-tl-sm border border-zinc-100 shadow-sm'
                }`}
            >
              {renderMessageContent(message.content)}
            </div>

            {/* Edit button — only for user messages */}
            {isUser && (
              <button
                onClick={handleEditStart}
                className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1 mr-1"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit
              </button>
            )}
          </>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-600 text-xs font-bold ml-2 flex-shrink-0 mt-1">
          {user?.profile?.name?.[0]?.toUpperCase() || 'U'}
        </div>
      )}
    </div>
  )
})

export default MessageBubble
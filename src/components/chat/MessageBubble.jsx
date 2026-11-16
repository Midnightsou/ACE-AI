import { memo, useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../../store/userStore'
import { useToast } from '../ui/Toast'

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

function formatCountdown(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const MessageBubble = memo(function MessageBubble({ message, index, onEdit, onVersionChange, onShare, sharing }) {
  const user = useUserStore((s) => s.user)
  const navigate = useNavigate()
  const { toast } = useToast()
  const isUser = message.role === 'user'
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(message.content)
  const [copying, setCopying] = useState(false)
  const textareaRef = useRef(null)
  const [now, setNow] = useState(null)
  const versions = message.versions || []
  const versionIndex = message.versionIndex ?? versions.length - 1
  const cooldownTime = typeof message.cooldownUntil === 'number'
    ? message.cooldownUntil
    : Date.parse(message.cooldownUntil)

  useEffect(() => {
    if (!message.cooldownUntil) return undefined
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [message.cooldownUntil])

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

  async function handleCopy() {
    setCopying(true)
    try {
      await navigator.clipboard.writeText(message.content || '')
      toast.success('Message copied')
    } catch {
      toast.error('Failed to copy message')
    } finally {
      setCopying(false)
    }
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 group`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">
          A
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
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
              {message.cooldownUntil && now && cooldownTime > now && (
                <p className="mt-3 text-xs font-medium text-amber-700">
                  Recharge timer: {formatCountdown(cooldownTime - now)}
                </p>
              )}
              {message.showUpgrade && (
                <button
                  onClick={() => navigate('/pricing')}
                  className="mt-3 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700"
                >
                  Upgrade to Pro or Premium
                </button>
              )}
            </div>

            <div className={`flex items-center gap-2 mx-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
              <button
                onClick={handleCopy}
                disabled={copying}
                title="Copy message"
                aria-label="Copy message"
                className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors disabled:opacity-40"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="8" y="8" width="13" height="13" rx="2"/>
                  <path d="M16 8V5a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2h3"/>
                </svg>
              </button>
              {!isUser && (
                <button
                  onClick={() => onShare?.(message)}
                  disabled={sharing}
                  title="Share message"
                  aria-label="Share message"
                  className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors disabled:opacity-40"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>
                  </svg>
                </button>
              )}

              {/* Edit button — only for user messages */}
              {isUser && (
                <>
                  {versions.length > 1 && (
                    <div className="flex items-center gap-1 text-xs text-zinc-400">
                      <button
                        onClick={() => onVersionChange?.(index, versionIndex - 1)}
                        disabled={versionIndex <= 0}
                        aria-label="Show previous message version"
                        className="rounded px-1 hover:bg-zinc-100 disabled:opacity-30"
                      >
                        ‹
                      </button>
                      <span>{versionIndex + 1}/{versions.length}</span>
                      <button
                        onClick={() => onVersionChange?.(index, versionIndex + 1)}
                        disabled={versionIndex >= versions.length - 1}
                        aria-label="Show next message version"
                        className="rounded px-1 hover:bg-zinc-100 disabled:opacity-30"
                      >
                        ›
                      </button>
                    </div>
                  )}
                  <button
                    onClick={handleEditStart}
                    title="Edit message"
                    aria-label="Edit message"
                    className="text-zinc-400 hover:text-zinc-700 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </>
              )}
            </div>
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
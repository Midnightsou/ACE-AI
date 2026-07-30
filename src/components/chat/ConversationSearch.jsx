import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../../store/userStore'
import { useConversationStore } from '../../store/conversationStore'
import { useToolStore } from '../../store/toolStore'

export default function ConversationSearch({ onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const { conversations } = useConversationStore()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const q = query.toLowerCase()
    const filtered = conversations.filter((c) =>
      c.title?.toLowerCase().includes(q) ||
      c.toolName?.toLowerCase().includes(q)
    )
    setResults(filtered.slice(0, 10))
  }, [query, conversations])

  function handleSelect(convo) {
    if (convo.type === 'tool') {
      navigate(`/tool/${convo.toolId}`, { state: { sessionId: convo.id } })
    } else {
      navigate('/chat')
    }
    onClose()
  }

  function formatDate(ts) {
    if (!ts) return ''
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts)
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    } catch { return '' }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations and sessions..."
            className="flex-1 text-sm text-zinc-800 placeholder:text-zinc-400 outline-none"
          />
          <kbd className="text-xs text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">Esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {query && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-zinc-400">
              No conversations found for "{query}"
            </div>
          )}

          {!query && (
            <div className="px-4 py-6 text-center text-sm text-zinc-400">
              Type to search your conversations
            </div>
          )}

          {results.map((convo) => (
            <button
              key={convo.id}
              onClick={() => handleSelect(convo)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors text-left border-b border-zinc-50 last:border-0"
            >
              <span className="text-lg flex-shrink-0">
                {convo.type === 'tool' ? (convo.icon || '🔧') : '💬'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-800 truncate">{convo.title || 'Untitled'}</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {convo.type === 'tool' ? convo.toolName : 'Chat'} · {formatDate(convo.updatedAt)}
                </p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
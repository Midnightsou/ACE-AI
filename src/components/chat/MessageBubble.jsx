import { useState, useRef } from 'react'
import { useUserStore } from '../../store/userStore'

export default function MessageBubble({ message, index, onEdit }) {
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
              {message.content}
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
}
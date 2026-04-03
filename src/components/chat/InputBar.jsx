import { useState } from 'react'

export default function InputBar({ onSend, disabled }) {
  const [text, setText] = useState('')

  function handleSend() {
    if (!text.trim() || disabled) return
    onSend(text.trim())
    setText('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="p-4 border-t border-zinc-100 bg-white">
      <div className="flex items-end gap-2 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2 focus-within:border-violet-400 transition-colors">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Ace anything..."
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-sm text-zinc-800 placeholder:text-zinc-400 outline-none resize-none max-h-32 py-2 disabled:opacity-50"
          style={{ scrollbarWidth: 'none' }}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className="w-8 h-8 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors flex-shrink-0 mb-1"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22 11 13 2 9l20-7z" />
          </svg>
        </button>
      </div>
      <p className="text-center text-xs text-zinc-400 mt-2">
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  )
}
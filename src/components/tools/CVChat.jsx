import { useEffect, useRef } from 'react'

const SUGGESTIONS = [
  'Make the summary more confident',
  'Use stronger action verbs throughout',
  'Make it more suitable for a startup',
  'Trim the skills section',
  'Add more emphasis on leadership',
  'Make bullet points more concise',
]

export default function CVChat({ currentCV, onUpdate }) {
  const { messages, loading, input, setInput, send, reset } = onUpdate
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(currentCV)
    }
  }

  return (
    <div className="flex flex-col gap-3">

      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">A</span>
        </div>
        <p className="text-sm font-semibold text-zinc-800">
          Refine with Ace
        </p>
        <span className="text-xs bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full ml-auto">
          CV in context
        </span>
      </div>

      <p className="text-xs text-zinc-400 leading-relaxed">
        Ask Ace to tweak anything — tone, bullet points, summary, skills. The CV updates live.
      </p>

      {/* Quick suggestions */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setInput(s)
              }}
              className="text-xs px-3 py-1.5 bg-zinc-100 hover:bg-violet-50 hover:text-violet-700 text-zinc-600 rounded-xl transition-colors border border-zinc-200 hover:border-violet-300"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed
                ${msg.role === 'user'
                  ? 'bg-violet-600 text-white rounded-tr-sm'
                  : 'bg-white border border-zinc-100 text-zinc-700 rounded-tl-sm shadow-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-zinc-100 shadow-sm px-3 py-2 rounded-xl rounded-tl-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 focus-within:border-violet-400 transition-colors">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Make the summary more confident..."
          disabled={loading}
          className="flex-1 bg-transparent text-sm text-zinc-800 placeholder:text-zinc-400 outline-none disabled:opacity-50"
        />
        <button
          onClick={() => send(currentCV)}
          disabled={loading || !input.trim()}
          className="w-7 h-7 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13"/>
            <path d="M22 2L15 22 11 13 2 9l20-7z"/>
          </svg>
        </button>
      </div>

      <p className="text-xs text-zinc-400 text-center">
        Enter to send · CV preview updates automatically
      </p>
    </div>
  )
}
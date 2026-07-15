import { useState, useEffect, useRef } from 'react'
import { useAutoResize } from '../../../hooks/useAutoResize'
import { useDojo } from '../../../hooks/useDojo'
import { useDojoStore } from '../../../store/dojoStore'

const QUICK_QUESTIONS = [
  'Summarize the main points from all sources',
  'What are the most important ideas?',
  'What do the sources agree on?',
  'What are the key differences between sources?',
  'What questions do these sources raise?',
]

export default function DojoChat() {
  const { messages, streamingContent, loading, sendMessage, readySources } = useDojo()
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  useAutoResize(inputRef, input)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  function handleSend() {
    if (!input.trim() || loading) return
    sendMessage(input.trim())
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {readySources.length === 0 && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Add files, paste text, or URLs on the left to start chatting with Ace.
          </div>
        )}

        {messages.length === 0 && (
          <div className="flex flex-col gap-3">
            <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">A</span>
                </div>
                <p className="text-xs font-semibold text-violet-700">Ace Dojo</p>
              </div>
              <p className="text-sm text-violet-800 leading-relaxed">
                {readySources.length > 0
                  ? `I've read all ${readySources.length} source${readySources.length !== 1 ? 's' : ''} you uploaded. Ask me anything about them — I'll answer strictly from your content and tell you which source each answer comes from.`
                  : 'Start by adding sources, then ask Ace anything about them.'}
              </p>
            </div>

            <p className="text-xs text-zinc-400 text-center mt-2">Try asking:</p>
            <div className="flex flex-col gap-2">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q)
                    inputRef.current?.focus()
                  }}
                  className="text-sm text-left px-4 py-3 bg-white border border-zinc-200 rounded-xl hover:border-violet-400 hover:bg-violet-50 transition-colors text-zinc-600 hover:text-violet-700"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">
                A
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                ${msg.role === 'user'
                  ? 'bg-violet-600 text-white rounded-tr-sm'
                  : 'bg-white border border-zinc-100 shadow-sm text-zinc-800 rounded-tl-sm'
                }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {streamingContent && (
          <div className="flex justify-start mb-4">
            <div className="w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">
              A
            </div>
            <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed bg-white border border-zinc-100 shadow-sm text-zinc-800 whitespace-pre-wrap">
              {streamingContent}
              <span className="inline-block w-1.5 h-4 bg-violet-500 ml-0.5 animate-pulse rounded-sm align-middle" />
            </div>
          </div>
        )}

        {loading && !streamingContent && (
          <div className="flex justify-start mb-4">
            <div className="w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0">
              A
            </div>
            <div className="bg-white border border-zinc-100 shadow-sm px-4 py-3 rounded-2xl flex items-center gap-1">
              <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-4 border-t border-zinc-100 bg-white">
        <div className="flex items-end gap-2 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 focus-within:border-violet-400 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your sources..."
            disabled={loading}
            rows={1}
            className="flex-1 bg-transparent text-sm text-zinc-800 placeholder:text-zinc-400 outline-none resize-none max-h-32 py-1 disabled:opacity-50"
            style={{ scrollbarWidth: 'none' }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim() || readySources.length === 0}
            className="w-8 h-8 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M22 2L11 13"/>
              <path d="M22 2L15 22 11 13 2 9l20-7z"/>
            </svg>
          </button>
        </div>
        <p className="text-center text-xs text-zinc-400 mt-2">
          {readySources.length > 0
            ? 'Ace answers only from your uploaded sources'
            : 'Add sources to start chatting'}
        </p>
      </div>
    </div>
  )
}
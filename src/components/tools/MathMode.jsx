import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useMathMode } from '../../hooks/useMathMode'
import { useMathStore } from '../../store/mathStore'
import { useAutoResize } from '../../hooks/useAutoResize'
import MathMessage from './MathMessage'
import ToolMessageBubble from './ToolMessageBubble'
import 'katex/dist/katex.min.css'

const QUICK_PROBLEMS = [
  'Solve x² + 5x + 6 = 0',
  'Find the derivative of f(x) = 3x³ - 2x² + 5x - 1',
  'Integrate ∫(2x + 3)dx',
  'Solve the system: 2x + y = 7, x - y = 2',
  'Find the limit as x→0 of sin(x)/x',
  'Expand (x + 2)³',
  'What is the probability of rolling a sum of 7 with two dice?',
  'Graph y = x² - 4x + 3',
  'Convert 45 degrees to radians',
  ]

export default function MathMode() {
  const { messages, streamingContent, send, clearMessages, loadSession } = useMathMode()
  const sessionId = useMathStore((s) => s.sessionId)
  const truncateFrom = useMathStore((s) => s.truncateFrom)
  const location = useLocation()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  useAutoResize(inputRef, input)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Restore from location state (sidebar click) OR keep current session
  useEffect(() => {
    const sid = location.state?.sessionId
    if (sid && sid !== sessionId) {
      loadSession(sid)
    }
  }, [location.state?.sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSend() {
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    setLoading(true)
    await send(text)
    setLoading(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleEdit(index, newContent) {
    truncateFrom(index)
    send(newContent)
  }

  return (
    <div className="flex flex-col h-full bg-zinc-50">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-zinc-100 flex-shrink-0">
        <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm font-bold">∑</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-zinc-900">Axioma</p>
          <p className="text-xs text-zinc-400">Step-by-step solver · LaTeX rendering · Graphs</p>
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
            <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center">
              <span className="text-3xl font-bold text-violet-600">∑</span>
            </div>
            <div className="text-center">
              <p className="font-semibold text-zinc-800">Axioma</p>
              <p className="text-sm text-zinc-400 mt-1 max-w-xs">
                I'm your math assitant. Ask me any math questions
              </p>
            </div>
            <div className="w-full max-w-lg flex flex-col gap-2">
              <p className="text-xs text-zinc-400 text-center mb-1">Try these</p>
              {QUICK_PROBLEMS.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setInput(p)
                    inputRef.current?.focus()
                  }}
                  className="text-sm text-left px-4 py-3 bg-white border border-zinc-200 rounded-xl hover:border-violet-400 hover:bg-violet-50 transition-colors text-zinc-600 hover:text-violet-700 font-mono"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          msg.role === 'user' ? (
            <ToolMessageBubble
              key={i}
              message={msg}
              index={i}
              isUser={true}
              onEdit={handleEdit}
            />
          ) : (
            <MathMessage key={i} message={msg} isStreaming={false} />
          )
        ))}

        {streamingContent && (
          <MathMessage
            message={{ role: 'assistant', content: streamingContent }}
            isStreaming={true}
          />
        )}

        {loading && !streamingContent && (
          <div className="flex justify-start mb-4">
            <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0">
              ∑
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
      <div className="flex-shrink-0 px-4 py-4 bg-white border-t border-zinc-100">
        <div className="flex items-end gap-2 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 focus-within:border-violet-400 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a math problem... e.g. solve x² + 5x + 6 = 0"
            disabled={loading}
            rows={1}
            className="flex-1 bg-transparent text-sm text-zinc-800 placeholder:text-zinc-400 outline-none resize-none max-h-32 py-1 disabled:opacity-50 font-mono"
            style={{ scrollbarWidth: 'none' }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-8 h-8 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M22 2L11 13"/>
              <path d="M22 2L15 22 11 13 2 9l20-7z"/>
            </svg>
          </button>
        </div>
        <p className="text-center text-xs text-zinc-400 mt-2">
          Uses DeepSeek R1 · Supports algebra, calculus, statistics and more
        </p>
      </div>
    </div>
  )
}
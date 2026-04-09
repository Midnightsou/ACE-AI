import { useState, useEffect, useRef } from 'react'
import { useCodex } from '../../hooks/useCodex'
import { useToolStore } from '../../store/toolStore'
import CodexMessage from './CodexMessage'
import { getToolById } from '../../tools/registry'

const tool = getToolById('codex')

const LANGUAGE_OPTIONS = [
  { value: 'auto', label: 'Auto detect' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
  { value: 'php', label: 'PHP' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'sql', label: 'SQL' },
  { value: 'html', label: 'HTML/CSS' },
  { value: 'bash', label: 'Bash/Shell' },
]

const QUICK_STARTS = [
  'Help me build a REST API with Node.js and Express',
  'I want to create a React app with authentication',
  'Help me write a Python script to scrape a website',
  'I need to set up a database schema for an e-commerce app',
  'Help me debug this code',
  'Explain how async/await works in JavaScript',
]

export default function Codex() {
  const {
    messages,
    streamingContent,
    loading,
    language,
    setLanguage,
    send,
    startNewSession,
  } = useCodex()

  const setActiveTool = useToolStore((s) => s.setActiveTool)
  const [input, setInput] = useState('')
  const [showLangPicker, setShowLangPicker] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  function handleSend() {
    if (!input.trim() || loading) return
    send(input.trim())
    setInput('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const currentLanguageLabel = LANGUAGE_OPTIONS.find(l => l.value === language)?.label || 'Auto'

  return (
    <div className="flex flex-col h-full bg-zinc-50">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-zinc-100 flex-shrink-0">
        <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold font-mono">{'</>'}</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-zinc-900">Codex</p>
          <p className="text-xs text-zinc-400">AI coding assistant</p>
        </div>

        {/* Language picker */}
        <div className="relative">
          <button
            onClick={() => setShowLangPicker((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-xs text-zinc-600 font-medium transition-colors"
          >
            {currentLanguageLabel}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              className={`transition-transform ${showLangPicker ? 'rotate-180' : ''}`}
            >
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>

          {showLangPicker && (
            <div className="absolute right-0 top-9 bg-white border border-zinc-200 rounded-xl shadow-lg z-20 py-1 w-44 max-h-64 overflow-y-auto">
              {LANGUAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setLanguage(opt.value)
                    setShowLangPicker(false)
                  }}
                  className={`w-full text-left px-4 py-2 text-xs transition-colors
                    ${language === opt.value
                      ? 'bg-violet-50 text-violet-700 font-medium'
                      : 'text-zinc-600 hover:bg-zinc-50'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* New session */}
        {messages.length > 0 && (
          <button
            onClick={startNewSession}
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

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 pb-16">
            <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center">
              <span className="text-white text-xl font-bold font-mono">{'</>'}</span>
            </div>
            <div className="text-center">
              <p className="font-semibold text-zinc-800">Ace Codex</p>
              <p className="text-sm text-zinc-400 mt-1 max-w-xs">
                Your AI coding partner. Tell me what you want to build and I'll help you plan and code it.
              </p>
            </div>

            {/* Quick starts */}
            <div className="w-full max-w-lg flex flex-col gap-2">
              <p className="text-xs text-zinc-400 text-center mb-1">Quick starts</p>
              {QUICK_STARTS.map((qs) => (
                <button
                  key={qs}
                  onClick={() => {
                    setInput(qs)
                    inputRef.current?.focus()
                  }}
                  className="text-sm text-left px-4 py-3 bg-white border border-zinc-200 rounded-xl hover:border-violet-400 hover:bg-violet-50 transition-colors text-zinc-600 hover:text-violet-700"
                >
                  {qs}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((msg, i) => (
          <CodexMessage key={i} message={msg} isStreaming={false} />
        ))}

        {/* Streaming message */}
        {streamingContent && (
          <CodexMessage
            message={{ role: 'assistant', content: streamingContent }}
            isStreaming={true}
          />
        )}

        {/* Loading indicator */}
        {loading && !streamingContent && (
          <div className="flex justify-start mb-4">
            <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0">
              {'</>'}
            </div>
            <div className="bg-white border border-zinc-100 shadow-sm px-4 py-3 rounded-2xl flex items-center gap-1">
              <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
            placeholder="Ask Codex to build something, explain code, or debug an issue..."
            disabled={loading}
            rows={1}
            className="flex-1 bg-transparent text-sm text-zinc-800 placeholder:text-zinc-400 outline-none resize-none max-h-40 py-1 disabled:opacity-50 font-sans"
            style={{ scrollbarWidth: 'none' }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-8 h-8 bg-zinc-900 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M22 2L11 13"/>
              <path d="M22 2L15 22 11 13 2 9l20-7z"/>
            </svg>
          </button>
        </div>
        <p className="text-center text-xs text-zinc-400 mt-2">
          Enter to send · Shift+Enter for new line.
        </p>
      </div>
    </div>
  )
}
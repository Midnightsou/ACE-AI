import { useEffect, useRef } from 'react'
import { useChat } from '../../hooks/useChat'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import InputBar from './InputBar'
import { useUserStore } from '../../store/userStore'

export default function ChatWindow() {
  const { messages, loading, send } = useChat()
  const user = useUserStore((s) => s.user)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const name = user?.profile?.name || 'there'

  return (
    
        
  <div className="flex flex-col" style={{ height: '100%' }}>

      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-100 bg-white flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-white text-sm font-bold">
          A
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900">Ace</p>
          <p className="text-xs text-zinc-400">Your personal tutor</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-zinc-50">

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 pb-12">
            <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">👋</span>
            </div>
            <div>
              <p className="font-semibold text-zinc-800">Hey {name}!</p>
              <p className="text-sm text-zinc-500 mt-1">
                I'm Ace — ask me anything. Maths, English, Science, JAMB — I got you.
              </p>
            </div>

            {/* Quick prompts */}
            <div className="flex flex-col gap-2 w-full max-w-xs mt-2">
              {[
                'Solve x² + 5x + 6 = 0',
                'Explain photosynthesis simply',
                'Give me 5 JAMB English tips',
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => send(prompt)}
                  className="text-sm text-left px-4 py-3 bg-white border border-zinc-200 rounded-xl hover:border-violet-400 hover:bg-violet-50 transition-colors text-zinc-700"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <InputBar onSend={send} disabled={loading} />
    </div>
  )
}
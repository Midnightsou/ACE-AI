import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { loadSharedConversation } from '../services/shareService'

export default function SharedConversationPage() {
  const { shareId } = useParams()
  const [conversation, setConversation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    loadSharedConversation(shareId).then((data) => {
      if (data) setConversation(data)
      else setNotFound(true)
    }).catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [shareId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-2xl">🔗</p>
        <p className="font-semibold text-zinc-800">Link expired or not found</p>
        <p className="text-sm text-zinc-400">Shared conversations expire after 7 days.</p>
        <Link to="/" className="text-violet-600 text-sm hover:underline">Go to Ace</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="bg-white border-b border-zinc-100 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-sm font-bold">A</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-800">{conversation.title}</p>
            <p className="text-xs text-zinc-400">Shared from Ace · expires in 7 days</p>
          </div>
        </div>
        <Link
          to="/signup"
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-xl transition-colors"
        >
          Try Ace free
        </Link>
      </div>

      {/* Messages */}
      <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-4">
        {conversation.messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">
                A
              </div>
            )}
            <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
              ${msg.role === 'user'
                ? 'bg-violet-600 text-white rounded-tr-sm'
                : 'bg-white text-zinc-800 rounded-tl-sm border border-zinc-100 shadow-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* CTA */}
        <div className="mt-8 bg-violet-50 border border-violet-200 rounded-2xl p-6 text-center">
          <p className="font-semibold text-violet-800 mb-2">Continue this conversation on Ace</p>
          <p className="text-sm text-violet-600 mb-4">
            Ace is a free AI workspace for writing, coding, research, and more.
          </p>
          <Link
            to="/signup"
            className="inline-block px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Get started free
          </Link>
        </div>
      </div>
    </div>
  )
}
import { useEffect, useRef, useState } from 'react'
import { useChat } from '../../hooks/useChat'
import { useUserStore } from '../../store/userStore'
import MessageBubble from './MessageBubble'
import GrimMascot from '../GrimMascot'
import InputBar from './InputBar'
import FileContextBanner from './FileContextBanner'
import StreamingBubble from './StreamingBubble'
import CopyConversation from './CopyConversation'
import ThemeToggle from '../ui/ThemeToggle'
import { MessageSkeleton } from '../ui/Skeleton'
import { createShareLink } from '../../services/shareService'
import { useConversationStore } from '../../store/conversationStore'
import { useToast } from '../ui/Toast'

const starterPrompts = {
  english: ['Solve x² + 5x + 6 = 0', 'Explain photosynthesis simply', 'Help me write a CV opening line', 'Summarise this topic for revision'],
  pidgin: ['Solve x² + 5x + 6 = 0', 'Explain photosynthesis make e simple', 'Help me write correct email', 'Summarise this topic make I take read'],
  yoruba: ['Yanju x² + 5x + 6 = 0', 'Ṣàlàyé photosynthesis ní ọ̀nà tí ó rọrùn', 'Ràn mí lọ́wọ́ láti kọ email', 'Ṣe àkótán fún àtúnyẹ̀wò'],
  hausa: ['Magance x² + 5x + 6 = 0', 'Bayyana photosynthesis a saukake', 'Taimaka mini in rubuta email', 'Taƙaita wannan don nazari'],
}

const languageLabels = {
  english: 'English',
  pidgin: 'Pidgin',
  yoruba: 'Yoruba',
  hausa: 'Hausa',
}

export default function ChatWindow() {
  const {
    messages, streamingContent, loading,
    fileContext, setFileContext,
    isSearching, loadingConversation,
    send, handleEdit, retry,
  } = useChat()
  const user = useUserStore((s) => s.user)
  const bottomRef = useRef(null)

  const language = user?.profile?.language || 'english'
  const activeConversationId = useConversationStore((s) => s.activeConversationId)
  const activeConversation = useConversationStore((s) =>
    s.conversations.find((c) => c.id === s.activeConversationId)
  )
  const { toast } = useToast()
  const [sharing, setSharing] = useState(false)

  async function handleShare() {
    if (!messages.length || !user?.uid) return
    setSharing(true)
    try {
      const url = await createShareLink(
        user.uid,
        activeConversationId || 'temp',
        messages,
        activeConversation?.title || 'Ace Conversation'
      )
      await navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard')
    } catch (err) {
      console.error(err)
      toast.error('Failed to create share link')
    } finally {
      setSharing(false)
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, isSearching, streamingContent])

  const name = user?.profile?.name || 'there'

  return (
    <div className="flex flex-col flex-1 min-h-0">

      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-100 bg-white flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-white text-sm font-bold">
          A
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900">Ace</p>
          <p className="text-xs text-zinc-400">{languageLabels[language]} mode</p>
        </div>
        <button
          onClick={handleShare}
          disabled={sharing || !messages.length}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-violet-600 transition-colors disabled:opacity-40"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          Share
        </button>
        <CopyConversation messages={messages} />
        <ThemeToggle className="ml-auto" />
      </div>

      {/* File context banner */}
      <FileContextBanner file={fileContext} onClear={() => setFileContext(null)} />

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto">

        {loadingConversation ? (
          <MessageSkeleton />
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 pb-12 px-4">
            <div>
              <GrimMascot mood="think" size={120} />
            </div>
            <div>
              <p className="font-semibold text-zinc-800">Hey {name}!</p>
              <p className="text-sm text-zinc-500 mt-1">
                I'm Ace ask me anything, I got you.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs mt-2">
              {(starterPrompts[language] || starterPrompts.english).map((prompt) => (
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
        ) : (
          <>
            {messages.map((msg, i) => (
              <MessageBubble
                key={i}
                message={msg}
                index={i}
                onEdit={handleEdit}
              />
            ))}

            {/* Searching indicator */}
            {isSearching && (
              <div className="flex justify-start mb-3">
                <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0">
                  A
                </div>
                <div className="bg-white border border-zinc-100 shadow-sm px-4 py-3 rounded-2xl flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-zinc-500">Searching the web...</span>
                </div>
              </div>
            )}

            {/* Streaming */}
            {streamingContent && !isSearching && (
              <StreamingBubble content={streamingContent} />
            )}

            {/* Retry on failure */}
            {!loading && !streamingContent && messages.length >= 2 && messages[messages.length - 1]?.role === 'assistant' && /went wrong|no internet|connection/i.test(messages[messages.length - 1]?.content || '') && (
              <div className="flex justify-start mb-3">
                <button
                  onClick={retry}
                  className="min-h-11 px-4 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-violet-700 hover:border-violet-400 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading — Grim thinks while DeepSeek works */}
            {loading && !streamingContent && !isSearching && (
              <div className="flex items-center gap-3 px-4 py-3">
                <GrimMascot mood="think" size={56} />
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Thinking…</span>
              </div>
            )}
          </>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <InputBar
        onSend={send}
        onFileExtracted={setFileContext}
        disabled={loading || isSearching}
      />
    </div>
  )
}
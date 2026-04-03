import { useEffect } from 'react'
import { useConversationStore } from '../../store/conversationStore'
import { useUserStore } from '../../store/userStore'
import { useChatStore } from '../../store/chatStore'
import { useChat } from '../../hooks/useChat'
import { loadConversations } from '../../services/memory'
import { useAuth } from '../../hooks/useAuth'
import LanguageToggle from '../ui/LanguageToggle'

export default function Sidebar({ isOpen, onClose }) {
  const user = useUserStore((s) => s.user)
  const { logout } = useAuth()
  const {
    conversations,
    activeConversationId,
    setConversations,
    setActiveConversationId,
  } = useConversationStore()
  const clearMessages = useChatStore((s) => s.clearMessages)
  const { startNewChat } = useChat()

  useEffect(() => {
    if (!user?.uid) return
    loadConversations(user.uid)
      .then((convos) => setConversations(convos))
      .catch((err) => console.error('Failed to load conversations:', err))
  }, [user?.uid])

  function handleSelectConversation(id) {
    setActiveConversationId(id)
    onClose()
  }

  function handleNewChat() {
    startNewChat()
    onClose()
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-zinc-900 z-30 flex flex-col transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0`}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <span className="text-white font-semibold text-sm">Ace</span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors md:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* New chat button */}
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 transition-colors text-sm text-zinc-300 hover:text-white"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            New chat
          </button>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {conversations.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center mt-8 px-4">
              No conversations yet. Start chatting!
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              <p className="text-xs text-zinc-500 px-2 py-2 uppercase tracking-wider">
                Recent
              </p>
              {conversations.map((convo) => (
                <button
                  key={convo.id}
                  onClick={() => handleSelectConversation(convo.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors truncate
                    ${activeConversationId === convo.id
                      ? 'bg-violet-600 text-white'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                    }`}
                >
                  {convo.title || 'New chat'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Language selector */}
        <div className="border-t border-zinc-800">
          <LanguageToggle onClose={onClose} />
        </div>

        {/* User info + logout */}
        <div className="p-3 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 text-xs font-bold flex-shrink-0">
              {user?.profile?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">
                {user?.profile?.name || 'User'}
              </p>
              <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0"
              title="Log out"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
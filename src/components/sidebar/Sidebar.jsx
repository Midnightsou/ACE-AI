import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useConversationStore } from '../../store/conversationStore'
import { useUserStore } from '../../store/userStore'
import { useChatStore } from '../../store/chatStore'
import { useAuth } from '../../hooks/useAuth'
import { useToolStore } from '../../store/toolStore'
import { tools, toolCategories } from '../../tools/registry'
import { loadConversations } from '../../services/memory'
import { useCodex } from '../../hooks/useCodex'
import { useMathMode } from '../../hooks/useMathMode'

export default function Sidebar({ isOpen, onClose }) {
  const user = useUserStore((s) => s.user)
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { activeTool, setActiveTool } = useToolStore()
  const {
    conversations,
    activeConversationId,
    setConversations,
    setActiveConversationId,
  } = useConversationStore()
  const clearMessages = useChatStore((s) => s.clearMessages)
  const codex = useCodex()
  const math = useMathMode()
  const [showTools, setShowTools] = useState(true)
  const [showRecents, setShowRecents] = useState(true)

  useEffect(() => {
    if (!user?.uid) return
    loadConversations(user.uid)
      .then((convos) => setConversations(convos))
      .catch((err) => console.error('Failed to load conversations:', err))
  }, [user?.uid])

  function handleSelectTool(tool) {
    setActiveTool(tool.id)
    navigate(tool.path)
    onClose()
  }

  function handleSelectConversation(convo) {
    const isTool = convo.type === 'tool'

    if (isTool) {
      setActiveTool(convo.toolId)

      // Load session history for tool
      if (convo.toolId === 'codex') {
        codex.loadSession(convo.id)
      } else if (convo.toolId === 'math') {
        math.loadSession(convo.id)
      }

      navigate(`/tool/${convo.toolId}`)
    } else {
      setActiveConversationId(convo.id)
      navigate('/chat')
    }
    onClose()
  }

  function handleNewChat() {
    setActiveTool('chat')
    setActiveConversationId(null)
    clearMessages()
    navigate('/chat')
    onClose()
  }

  return (
    <>
      {/* Overlay */}
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
        <div className="p-4 flex items-center justify-between border-b border-zinc-800 flex-shrink-0">
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
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* New chat */}
          <div className="p-3">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 transition-colors text-sm text-zinc-300 hover:text-white"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New chat
            </button>
          </div>

          {/* Tools page button */}
          <div className="px-3 pb-2">
            <button
              onClick={() => { navigate('/tools'); onClose() }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm
                ${location.pathname === '/tools'
                  ? 'bg-violet-600 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              All tools
            </button>
          </div>

          {/* Recent conversations */}
          <div className="px-3 pb-3">
            <button
              onClick={() => setShowRecents((v) => !v)}
              className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-wider"
            >
              <span>Recent chats</span>
              <svg
                width="12" height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className={`transition-transform duration-200 ${showRecents ? 'rotate-180' : ''}`}
              >
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>

            {showRecents && (
              <div className="flex flex-col gap-0.5 mt-1">
                {conversations.length === 0 ? (
                  <p className="text-xs text-zinc-600 px-2 py-2">No conversations yet.</p>
                ) : (
                  conversations.map((convo) => {
                    const isTool = convo.type === 'tool'
                    return (
                      <button
                        key={convo.id}
                        onClick={() => handleSelectConversation(convo)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors flex items-center gap-2 min-w-0
                          ${(isTool && activeTool === convo.toolId) || (!isTool && activeConversationId === convo.id && activeTool === 'chat')
                            ? 'bg-violet-600 text-white'
                            : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                          }`}
                      >
                        {isTool && <span className="text-sm flex-shrink-0">{convo.icon}</span>}
                        <span className="truncate text-xs">
                          {convo.title || (isTool ? convo.toolName : 'New chat')}
                        </span>
                      </button>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom */}
        <div className="flex-shrink-0 border-t border-zinc-800">
          <button
            onClick={() => { navigate('/profile'); onClose() }}
            className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-zinc-800 transition-colors w-full text-left"
          >
            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 text-xs font-bold flex-shrink-0">
              {user?.profile?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">
                {user?.profile?.name || 'User'}
              </p>
              <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

      </div>
    </>
  )
}
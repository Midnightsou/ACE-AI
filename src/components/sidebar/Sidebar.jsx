import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useConversationStore } from '../../store/conversationStore'
import { useUserStore } from '../../store/userStore'
import { useChatStore } from '../../store/chatStore'
import { useToolStore } from '../../store/toolStore'
import { useChat } from '../../hooks/useChat'
import { useCodexStore } from '../../store/codexStore'
import { useMathStore } from '../../store/mathStore'
import { useCVMakerStore, useCVAnalyserStore } from '../../store/cvStore'
import { useCoverLetterStore } from '../../store/coverLetterStore'
import { useEssayStore } from '../../store/essayStore'
import { useEmailStore } from '../../store/emailStore'
import { useDojoStore } from '../../store/dojoStore'
import { deleteConversation, renameConversation, loadConversations } from '../../services/memory'
import ConversationSearch from '../chat/ConversationSearch'

export default function Sidebar({ isOpen, onClose }) {
  const user = useUserStore((s) => s.user)
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
  const { loadConversation } = useChat()
  const [showRecents, setShowRecents] = useState(true)
  const [showSearch, setShowSearch] = useState(false)
  const [menuOpen, setMenuOpen] = useState(null) // holds convo id
  const [renaming, setRenaming] = useState(null) // holds convo id
  const [renameValue, setRenameValue] = useState('')

  useEffect(() => {
    if (!user?.uid) return
    loadConversations(user.uid)
      .then((convos) => setConversations(convos))
      .catch((err) => console.error('Failed to load conversations:', err))
  }, [user?.uid, setConversations])

  useEffect(() => {
    function handleKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(true)
      }
      if (e.key === 'Escape') setShowSearch(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    function handleClick() { setMenuOpen(null) }
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  function clearToolStore(toolId) {
    const map = {
      'codex': () => useCodexStore.getState().clearMessages(),
      'math': () => useMathStore.getState().clearMessages(),
      'cv-maker': () => useCVMakerStore.getState().reset(),
      'cv-analyser': () => useCVAnalyserStore.getState().reset(),
      'cover-letter': () => useCoverLetterStore.getState().reset(),
      'essay-writer': () => useEssayStore.getState().reset(),
      'email-composer': () => useEmailStore.getState().reset(), 
      'dojo': () => useDojoStore.getState().clearSession(),
    }
    map[toolId]?.()
  }

  async function handleSelectConversation(convo) {
    const isTool = convo.type === 'tool'

    if (isTool) {
      setActiveTool(convo.toolId)
      clearToolStore(convo.toolId)
      navigate(`/tool/${convo.toolId}`, { state: { sessionId: convo.id } })
    } else {
      // Chat — load messages immediately, no refresh needed
      setActiveTool('chat')
      await loadConversation(convo.id)
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

  async function handleDelete(e, convId) {
    e.stopPropagation()
    if (!confirm('Delete this conversation?')) return
    try {
      await deleteConversation(user.uid, convId)
      const updated = await loadConversations(user.uid)
      setConversations(updated)
      if (activeConversationId === convId) {
        setActiveConversationId(null)
        clearMessages()
      }
      setMenuOpen(null)
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  async function handleRename(e, convId) {
    e.stopPropagation()
    if (!renameValue.trim()) return
    try {
      await renameConversation(user.uid, convId, renameValue.trim())
      const updated = await loadConversations(user.uid)
      setConversations(updated)
      setRenaming(null)
      setRenameValue('')
      setMenuOpen(null)
    } catch (err) {
      console.error('Rename failed:', err)
    }
  }

  function handleStartRename(e, convo) {
    e.stopPropagation()
    setRenaming(convo.id)
    setRenameValue(convo.title || '')
    setMenuOpen(null)
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={onClose}
        />
      )}

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
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Scrollable */}
        <div className="flex-1 overflow-y-auto">

          {/* New chat */}
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

          {/* Search button */}
          <div className="px-3">
            <button
              onClick={() => setShowSearch(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 transition-colors text-sm text-zinc-400 hover:text-white mt-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              Search
              <kbd className="ml-auto text-xs bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">⌘K</kbd>
            </button>
          </div>

          {/* Upgrade prompt for free users */}
          {!user?.profile?.isPro && (
            <div className="px-3 pb-2">
              <button
                onClick={() => { navigate('/pricing'); onClose() }}
                className="w-full flex items-center gap-2 px-3 py-2.5 bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/20 rounded-xl transition-colors text-left"
              >
                <span className="text-sm">⭐</span>
                <div>
                  <p className="text-sm font-medium text-violet-700">Upgrade to Pro</p>
                  <p className="text-xs text-violet-600/80">From ₦2,500/month</p>
                </div>
              </button>
            </div>
          )}

          {/* All tools button */}
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
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
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
              <span>Recent</span>
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
                  <p className="text-xs text-zinc-600 px-2 py-2">No history yet.</p>
                ) : (
                  conversations.map((convo) => {
                    const isTool = convo.type === 'tool'
                    const isActive = isTool
                      ? activeConversationId === convo.id
                      : activeConversationId === convo.id && activeTool === 'chat'
                    const isRenaming = renaming === convo.id
                    const isMenuOpen = menuOpen === convo.id

                    return (
                      <div key={convo.id} className="relative group/item">
                        {isRenaming ? (
                          // Rename input
                          <div className="flex items-center gap-1 px-2 py-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              autoFocus
                              type="text"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRename(e, convo.id)
                                if (e.key === 'Escape') { setRenaming(null); setRenameValue('') }
                              }}
                              className="flex-1 bg-zinc-800 text-white text-xs px-2 py-1.5 rounded-lg outline-none border border-violet-500 min-w-0"
                            />
                            <button
                              onClick={(e) => handleRename(e, convo.id)}
                              className="text-xs text-violet-400 hover:text-violet-300 px-1 flex-shrink-0"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => { setRenaming(null); setRenameValue('') }}
                              className="text-xs text-zinc-500 hover:text-zinc-300 px-1 flex-shrink-0"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSelectConversation(convo)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors flex items-center gap-2 min-w-0 pr-8
                              ${isActive
                                ? 'bg-violet-600 text-white'
                                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                              }`}
                          >
                            {isTool && <span className="text-sm flex-shrink-0">{convo.icon}</span>}
                            <span className="truncate text-xs flex-1">
                              {convo.title || (isTool ? convo.toolName : 'New chat')}
                            </span>
                          </button>
                        )}

                        {/* Three-dot menu button */}
                        {!isRenaming && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setMenuOpen(isMenuOpen ? null : convo.id)
                            }}
                            className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-lg
                              text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 transition-colors
                              opacity-0 group-hover/item:opacity-100"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
                            </svg>
                          </button>
                        )}

                        {/* Dropdown menu */}
                        {isMenuOpen && (
                          <div
                            className="absolute right-0 top-8 z-50 bg-zinc-800 border border-zinc-700 rounded-xl shadow-lg overflow-hidden w-36"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => handleStartRename(e, convo)}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors text-left"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                              Rename
                            </button>
                            <button
                              onClick={(e) => handleDelete(e, convo.id)}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-red-400 hover:bg-zinc-700 transition-colors text-left"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                                <path d="M10 11v6M14 11v6"/>
                                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                              </svg>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom */}
        <div className="flex-shrink-0">
          {/* User info */}
          <div className="p-3 border-t border-zinc-800">
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
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      {showSearch && <ConversationSearch onClose={() => setShowSearch(false)} />}
    </>
  )
}
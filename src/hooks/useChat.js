import { useState, useRef } from 'react'
import { useChatStore } from '../store/chatStore'
import { useConversationStore } from '../store/conversationStore'
import { useUserStore } from '../store/userStore'
import { streamCompletion, MODELS } from '../services/deepseekClient'
import { buildSystemPrompt } from '../prompts/systemPrompt'
import {
  createConversation,
  saveMessage,
  loadMessages,
  incrementMessageCount,
} from '../services/memory'
import {
  searchWeb,
  needsWebSearch,
  extractSearchQuery,
  buildSearchContext,
} from '../services/webSearch'
import { fetchURLContent } from '../services/urlFetcher'
import { canUseFeature } from '../config/pricing'

export function useChat() {
  const {
    messages, streamingContent, loading,
    addMessage, setStreamingContent, setLoading,
    clearMessages, truncateFrom,
    restoredConvId, setRestoredConvId,
  } = useChatStore()

  const {
    activeConversationId,
    setActiveConversationId, setConversations,
    bringToTop,
  } = useConversationStore()

  const user = useUserStore((s) => s.user)
  const [fileContext, setFileContext] = useState(null)
  const [searchCitations, setSearchCitations] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const abortRef = useRef(null)

  async function send(text) {
    if (!text.trim() || loading) return

    // Abort any in-flight request
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    const profile = user?.profile
    const allowed = canUseFeature(profile, 'message', profile?.dailyMessageCount || 0)
    if (!allowed) {
      addMessage({
        role: 'assistant',
        content: 'You have used all your free messages today. Upgrade to Pro for 200 messages per day. Go to Profile to upgrade.',
      })
      return
    }

    const userMessage = { role: 'user', content: text }
    addMessage(userMessage)
    setLoading(true)
    setStreamingContent('')
    setSearchCitations([])

    try {
      let convId = activeConversationId

      if (!convId) {
        const title = text.slice(0, 50) + (text.length > 50 ? '...' : '')
        convId = await createConversation(user.uid, title)
        setActiveConversationId(convId)
        const updated = await import('../services/memory').then((m) => m.loadConversations(user.uid))
        setConversations(updated)
      }

      await saveMessage(user.uid, convId, userMessage)

      // ── Step 1: Check for URLs in message ────────────────
      let enrichedText = text
      const urlMatches = text.match(/https?:\/\/[^\s]+/g)
      if (urlMatches?.length) {
        try {
          const fetched = await Promise.all(
            urlMatches.slice(0, 2).map(async (url) => {
              const content = await fetchURLContent(url)
              return `[Content from ${url}]:\n${content.slice(0, 3000)}`
            })
          )
          enrichedText += '\n\n' + fetched.join('\n\n')
        } catch {
          // silently fail
        }
      }

      // ── Step 2: Web search if needed ──────────────────────
      let searchSystemContext = ''
      let citations = []

      if (needsWebSearch(text)) {
        setIsSearching(true)
        try {
          const cleanedQuery = extractSearchQuery(text)
          const results = await searchWeb(cleanedQuery)
          if (results?.length) {
            const { systemContext, citations: cites } = buildSearchContext(results)
            searchSystemContext = systemContext
            citations = cites
            setSearchCitations(cites)
          }
        } catch {
          // silently fail
        }
        setIsSearching(false)
      }

      // ── Step 3: Build system prompt ───────────────────────
      const basePrompt = buildSystemPrompt(profile, messages)
      const fullSystemPrompt = searchSystemContext
        ? basePrompt + '\n\n' + searchSystemContext
        : basePrompt

      // ── Step 4: Build messages for AI ─────────────────────
      const fileContextText = fileContext?.content
        ? `\n\n[Uploaded file: ${fileContext.name}]\n${fileContext.content.slice(0, 8000)}`
        : ''

      const historyMessages = [
        ...messages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        {
          role: 'user',
          content: enrichedText + fileContextText,
        },
      ]

      // ── Step 5: Stream response ───────────────────────────
      const fullContent = await streamCompletion({
        model: MODELS.chat,
        messages: [
          { role: 'system', content: fullSystemPrompt },
          ...historyMessages,
        ],
        temperature: 0.5,
        maxTokens: 4096,
        onChunk: (content) => setStreamingContent(content),
        signal: abortRef.current.signal,
      })

      // ── Step 6: Append citation list to response ──────────
      let finalContent = fullContent

      if (citations.length > 0) {
        const usedCitations = citations.filter((c) =>
          fullContent.includes(`[Source ${c.index}]`)
        )
        if (usedCitations.length > 0) {
          finalContent += '\n\n━━━ Sources ━━━\n' +
            usedCitations.map((c) =>
              `[Source ${c.index}] ${c.title}\n${c.url}`
            ).join('\n\n')
        }
      }

      const assistantMessage = { role: 'assistant', content: finalContent }
      addMessage(assistantMessage)
      setStreamingContent('')

      await saveMessage(user.uid, convId, assistantMessage)
      await incrementMessageCount(user.uid)
      bringToTop(convId)

    } catch (err) {
      if (err.name === 'AbortError') return
      setStreamingContent('')
      addMessage({
        role: 'assistant',
        content: 'Something went wrong. Check your connection and try again.',
      })
      console.error('Chat error:', err)
    } finally {
      setLoading(false)
      setIsSearching(false)
      setStreamingContent('')
    }
  }

  async function loadConversation(convId) {
    if (restoredConvId === convId) return // Already loaded, don't re-fetch
    try {
      const msgs = await loadMessages(user.uid, convId)
      clearMessages()
      msgs.forEach((m) => addMessage(m))
      setActiveConversationId(convId)
      setRestoredConvId(convId)
    } catch (err) {
      console.error('Load conversation error:', err)
    }
  }

  function startNewChat() {
    if (abortRef.current) abortRef.current.abort()
    clearMessages()
    setActiveConversationId(null)
    setSearchCitations([])
    setFileContext(null)
  }

  function handleEdit(index, newContent) {
    truncateFrom(index)
    send(newContent)
  }

  return {
    messages, streamingContent, loading,
    fileContext, setFileContext,
    searchCitations, isSearching,
    send, loadConversation, startNewChat, handleEdit,
  }
}
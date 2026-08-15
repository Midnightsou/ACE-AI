import { useState, useRef } from 'react'
import { useChatStore } from '../store/chatStore'
import { useConversationStore } from '../store/conversationStore'
import { useUserStore } from '../store/userStore'
import { streamCompletion, complete, MODELS } from '../services/deepseekClient'
import { buildSystemPrompt } from '../prompts/systemPrompt'
import {
  createConversation,
  saveMessage,
  loadConversations,
  incrementMessageCount,
} from '../services/memory'
import { searchWeb, needsWebSearch, buildSearchContext, extractSearchQuery } from '../services/webSearch'
import { fetchURLContent } from '../services/urlFetcher'
import { canUseFeature } from '../config/pricing'

// Fire-and-forget Firebase save — never blocks the AI
async function saveToFirebase(uid, convIdRef, title, userMessage, assistantContent, setConversations) {
  try {
    let convId = convIdRef.current

    if (!convId) {
      convId = await createConversation(uid, title)
      convIdRef.current = convId
    }

    await saveMessage(uid, convId, userMessage)
    await saveMessage(uid, convId, { role: 'assistant', content: assistantContent })
    await incrementMessageCount(uid)

    // Refresh sidebar in background
    loadConversations(uid).then(setConversations).catch(() => {})
  } catch (err) {
    console.error('Background Firebase save failed:', err)
    // AI already responded — user is not affected
  }
}

export function useChat() {
  const {
    messages, streamingContent, loading,
    addMessage, setStreamingContent, setLoading,
    clearMessages, truncateFrom, setRestoredConvId,
  } = useChatStore()

  const {
    activeConversationId, setActiveConversationId,
    setConversations, bringToTop,
  } = useConversationStore()

  const user = useUserStore((s) => s.user)
  const [fileContext, setFileContext] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const abortRef = useRef(null)
  const convIdRef = useRef(activeConversationId || null)

  // Keep ref in sync with store
  convIdRef.current = activeConversationId

  async function send(text) {
    if (!text.trim() || loading) return

    // Abort any in-flight request
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    // Check message limit
    const profile = user?.profile
    const allowed = canUseFeature(profile, 'message', profile?.dailyMessageCount || 0)
    if (!allowed) {
      addMessage({
        role: 'assistant',
        content: 'You have used all your free messages for today. Upgrade to Pro for 200 messages per day — go to Profile to upgrade.',
      })
      return
    }

    // Check message length
    const estimatedTokens = Math.ceil(text.length / 4)
    if (estimatedTokens > 3000) {
      addMessage({ role: 'user', content: text })
      addMessage({
        role: 'assistant',
        content: `Your message is too long (around ${estimatedTokens} tokens). Please split it into smaller parts, or use Dojo mode if you want to analyse a large document.`,
      })
      return
    }

    const userMessage = { role: 'user', content: text }
    addMessage(userMessage)
    setLoading(true)
    setStreamingContent('')

    try {
      // ── Step 1: Enrich message ──────────────────────
      let enrichedText = text

      // Fetch URL content if message contains URLs
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
        } catch { }
      }

      // File context
      if (fileContext?.content) {
        enrichedText += `\n\n[Uploaded file: ${fileContext.name}]\n${fileContext.content.slice(0, 8000)}`
      }

      // ── Step 2: Web search if needed ─────────────────
      let searchSystemContext = ''

      if (needsWebSearch(text)) {
        setIsSearching(true)
        try {
          const query = extractSearchQuery(text)
          const results = await searchWeb(query)
          if (results?.length) {
            const { systemContext } = buildSearchContext(results)
            searchSystemContext = systemContext
          }
        } catch { }
        setIsSearching(false)
      }

      // ── Step 3: Build prompt ──────────────────────────
      const basePrompt = buildSystemPrompt(profile, messages)
      const fullSystemPrompt = searchSystemContext
        ? basePrompt + '\n\n' + searchSystemContext
        : basePrompt

      const historyMessages = [
        ...messages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user', content: enrichedText },
      ]

      // ── Step 4: Call DeepSeek IMMEDIATELY ────────────
      // Firebase is NOT involved here — pure AI call
      let fullContent = ''

      fullContent = await streamCompletion({
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

      // ── Step 5: Show response immediately ────────────
      const assistantMessage = { role: 'assistant', content: fullContent }
      addMessage(assistantMessage)
      setStreamingContent('')

      // ── Step 6: Save to Firebase in background ───────
      // User already sees the response — Firebase runs async
      const title = text.slice(0, 50) + (text.length > 50 ? '...' : '')
      const uid = user?.uid

      if (uid) {
        saveToFirebase(
          uid,
          convIdRef,
          title,
          userMessage,
          fullContent,
          setConversations,
        ).then(() => {
          // Update active conversation ID after save
          if (convIdRef.current) {
            setActiveConversationId(convIdRef.current)
            bringToTop(convIdRef.current)
          }
        })
      }

      // Auto-generate title after 2nd exchange
      const updatedMessages = [...messages, userMessage, assistantMessage]
      if (updatedMessages.length === 4 && uid && convIdRef.current) {
        generateTitle(updatedMessages, uid, convIdRef.current, setConversations)
      }

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

  // Generate title silently after 2 exchanges
  async function generateTitle(msgs, uid, convId, setConvs) {
    try {
      const context = msgs
        .slice(0, 4)
        .map((m) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content.slice(0, 100)}`)
        .join('\n')

      const title = await complete({
        model: MODELS.chat,
        messages: [{
          role: 'user',
          content: `Generate a 4-word title for this conversation. Return ONLY the title, no punctuation, no quotes.\n\n${context}`,
        }],
        temperature: 0.3,
        maxTokens: 20,
      })

      const cleanTitle = title.trim().replace(/["'.]/g, '').slice(0, 50)
      if (cleanTitle && uid && convId) {
        const { updateConversationTitle } = await import('../services/memory')
        await updateConversationTitle(uid, convId, cleanTitle)
        const { loadConversations } = await import('../services/memory')
        loadConversations(uid).then(setConvs).catch(() => {})
      }
    } catch { }
  }

  async function loadConversation(convId) {
    if (!convId || !user?.uid) return
    try {
      const { loadMessages } = await import('../services/memory')
      const msgs = await loadMessages(user.uid, convId)
      clearMessages()
      msgs.forEach((m) => addMessage(m))
      setActiveConversationId(convId)
      convIdRef.current = convId
      setRestoredConvId(convId)
    } catch (err) {
      console.error('Load conversation error:', err)
    }
  }

  function startNewChat() {
    if (abortRef.current) abortRef.current.abort()
    clearMessages()
    setActiveConversationId(null)
    convIdRef.current = null
    setFileContext(null)
  }

  function handleEdit(index, newContent) {
    truncateFrom(index)
    send(newContent)
  }

  return {
    messages, streamingContent, loading,
    fileContext, setFileContext,
    isSearching,
    send, loadConversation, startNewChat, handleEdit,
  }
}
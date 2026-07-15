import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '../store/chatStore'
import { useUserStore } from '../store/userStore'
import { useConversationStore } from '../store/conversationStore'
import { sendMessage } from '../services/deepseek'
import { fetchURLContent } from '../services/urlFetcher'

import {
  createConversation,
  saveMessage,
  loadMessages,
  getMessageCount,
  incrementMessageCount,
  updateStreak,
} from '../services/memory'
import { canUseFeature, getUpgradeMessage } from '../config/pricing'

export function useChat() {
  const {
    messages,
    loading,
    streamingContent,
    addMessage,
    setMessages,
    setLoading,
    setStreamingContent,
    clearStreaming,
    finalizeStreamingMessage,
    clearMessages,
  } = useChatStore()

  const user = useUserStore((s) => s.user)
  const {
    activeConversationId,
    setActiveConversationId,
    addConversation,
    bringToTop,
  } = useConversationStore()

  const [fileContext, setFileContext] = useState(null)
  const abortRef = useRef(null)

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId || !user?.uid) return
    clearMessages()

    loadMessages(user.uid, activeConversationId)
      .then((msgs) => setMessages(msgs))
      .catch((err) => console.error('Failed to load messages:', err))
  }, [activeConversationId])

  function attachFile(extracted) {
    setFileContext(extracted)
  }

  function clearFile() {
    setFileContext(null)
  }

  async function send(text) {
    if (!text.trim()) return

    if (abortRef.current) {
      abortRef.current.abort()
    }

    abortRef.current = new AbortController()
    const controller = abortRef.current

    const profile = user?.profile
    const messageCount = profile?.dailyMessageCount || 0
    const allowed = canUseFeature(profile, 'message', messageCount)

    if (!allowed) {
      addMessage({
        role: 'assistant',
        content: `${getUpgradeMessage('message')}\n\nGo to Settings → Pricing to upgrade.`,
      })
      return
    }

    let fullContent = text
    let enrichedBlocks = []

    // URL detection + fetching
    const urlMatches = text.match(/(https?:\/\/[^\s]+)/g)
    if (urlMatches && urlMatches.length > 0) {
      try {
        const fetchedContents = await Promise.all(
          urlMatches.slice(0, 2).map(async (url) => {
            const cleanUrl = url.replace(/[),.]+$/, '')
            const content = await fetchURLContent(cleanUrl)
            return `[Content from ${cleanUrl}]:\n${content}`
          })
        )
        enrichedBlocks.push(...fetchedContents)
      } catch (err) {
        console.warn('URL fetch failed:', err)
      }
    }

    // File context injection
    if (fileContext?.content) {
      const sourceLabel =
        fileContext.type === 'pdf'
          ? `PDF titled "${fileContext.name}"`
          : `image titled "${fileContext.name}"`

      enrichedBlocks.push(
        `The student has uploaded a ${sourceLabel}. Here is the extracted text content:\n\n${fileContext.content.slice(0, 6000)}`
      )

      setFileContext(null)
    }

    // Combine everything
    if (enrichedBlocks.length > 0) {
      fullContent = `${enrichedBlocks.join('\n\n---\n\n')}\n\n---\n\nStudent's question: ${text}`
    }

    const userMessage = { role: 'user', content: text }
    const messageForAI = { role: 'user', content: fullContent }

    addMessage(userMessage)
    setLoading(true)
    clearStreaming()

    try {
      let conversationId = activeConversationId

      if (!conversationId) {
        conversationId = await createConversation(user.uid, text)
        setActiveConversationId(conversationId)
        addConversation({
          id: conversationId,
          title: text.slice(0, 40) + (text.length > 40 ? '...' : ''),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }

      await saveMessage(user.uid, conversationId, userMessage)

      const history = [...messages, messageForAI]
      let finalReply = ''

      await sendMessage({
        messages: history,
        profile: user?.profile || {},
        recentMessages: messages.slice(-4),
        apiKey: import.meta.env.VITE_FEATHERLESS_API_KEY,
        signal: controller.signal,
        onChunk: (content) => {
          setStreamingContent(content)
          finalReply = content
        },
      })

      finalizeStreamingMessage()

      const assistantMessage = { role: 'assistant', content: finalReply }
      await saveMessage(user.uid, conversationId, assistantMessage)

      bringToTop(conversationId)
      await incrementMessageCount(user.uid)
      await updateStreak(user.uid)

    } catch (err) {
      if (err?.name === 'AbortError') {
        return
      }

      clearStreaming()

      const status = err?.status || err?.response?.status
      const errorMessages = {
        402: 'AI credits are empty. Contact support.',
        401: 'Invalid API key. Check configuration.',
        429: 'Too many requests. Wait a moment and try again.',
        503: 'AI servers are down. Try again shortly.',
      }

      addMessage({
        role: 'assistant',
        content:
          errorMessages[status] ||
          'Something went wrong. Check your connection and try again.',
      })

      console.error('AI error:', err)
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
        setLoading(false)
      }
    }
  }

  async function startNewChat() {
    setActiveConversationId(null)
    clearMessages()
  }
  

  return {
    messages,
    loading,
    streamingContent,
    send,
    startNewChat,
    fileContext,
    attachFile,
    clearFile,
  }
}
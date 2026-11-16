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
  reserveMessageSlot,
  updateMessage,
  loadConversationSummary,
  updateConversationSummary,
} from '../services/memory'
import { searchWeb, needsWebSearch, buildSearchContext, extractSearchQuery } from '../services/webSearch'
import { fetchURLContent } from '../services/urlFetcher'

function serializeMessageVersions(versions = []) {
  return versions.map((version) => ({
    content: version.content,
    continuation: (version.continuation || []).map((message) => ({
      role: message.role,
      content: message.content,
      ...(message.id ? { id: message.id } : {}),
      ...(message.versions ? { versions: serializeMessageVersions(message.versions) } : {}),
      ...(Number.isInteger(message.versionIndex) ? { versionIndex: message.versionIndex } : {}),
    })),
  }))
}

// Fire-and-forget Firebase save — never blocks the AI
async function saveToFirebase(
  uid,
  convIdRef,
  title,
  userMessage,
  assistantMessage,
  setConversations,
  setActiveConversationId,
  bringToTop,
) {
  if (!uid) {
    console.warn('Firebase save skipped: no user UID')
    return null
  }

  try {
    let convId = convIdRef.current

    console.log('[Chat Save] Starting save', {
      uid,
      existingConversationId: convId,
    })

    // Create conversation if this is a new chat
    if (!convId) {
      console.log('[Chat Save] Creating conversation...')

      convId = await createConversation(uid, title)

      console.log(
        '[Chat Save] Conversation created:',
        convId
      )

      // Update ref immediately
      convIdRef.current = convId

      // Update Zustand state
      setActiveConversationId(convId)
    }

    console.log('[Chat Save] Saving user message...')

    const userMessageId = await saveMessage(
      uid,
      convId,
      userMessage
    )
    useChatStore.getState().setMessageId(userMessage, userMessageId)

    console.log('[Chat Save] User message saved')

    console.log('[Chat Save] Saving assistant message...')

    const assistantMessageId = await saveMessage(
      uid,
      convId,
      {
        role: 'assistant',
        content: assistantMessage.content,
      }
    )
    useChatStore.getState().setMessageId(assistantMessage, assistantMessageId)

    console.log('[Chat Save] Assistant message saved')

    // Refresh sidebar
    try {
      const conversations =
        await loadConversations(uid)

      setConversations(conversations)

      bringToTop(convId)

      console.log(
        '[Chat Save] Conversations refreshed'
      )

    } catch (refreshErr) {
      console.error(
        '[Chat Save] Sidebar refresh failed:',
        refreshErr
      )
    }

    console.log(
      '[Chat Save] Successfully completed:',
      convId
    )

    return convId

  } catch (err) {
    console.error(
      '[Chat Save] FAILED:',
      err
    )

    return null
  }
}

export function useChat() {
  const {
    messages, streamingContent, loading,
    addMessage, setStreamingContent, setLoading,
    setMessages, clearMessages, setRestoredConvId,
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
  const lastUserTextRef = useRef('')
  const savePromiseRef = useRef(Promise.resolve())
  const summaryRef = useRef('')
  const summarizedMessageCountRef = useRef(0)
  const messageOffsetRef = useRef(0)
  const activeBranchRef = useRef(null)

  // Keep ref in sync with store
  convIdRef.current = activeConversationId

  async function send(text, { editIndex, previousAssistant, onUsage } = {}) {
    if (!text.trim() || loading) return

    // Abort any in-flight request
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    const estimatedTokens = Math.ceil(text.length / 4)
    if (estimatedTokens > 3000) {
      if (editIndex == null) addMessage({ role: 'user', content: text })
      addMessage({
        role: 'assistant',
        content: `Your message is too long (around ${estimatedTokens} tokens). Please split it into smaller parts, or use Dojo mode if you want to analyse a large document.`,
      })
      return
    }

    const profile = user?.profile
    let usage
    if (editIndex == null && user?.uid) {
      try {
        usage = await reserveMessageSlot(user.uid)
      } catch (err) {
        console.error('Unable to verify message limit:', err)
        addMessage({
          role: 'assistant',
          content: 'I could not check your message limit. Please check your connection and try again.',
        })
        return
      }

      if (!usage.allowed) {
        const freePlan = usage.planId === 'free'
        addMessage({
          role: 'assistant',
          content: freePlan
            ? 'Omo, you have used all 20 free messages. Even Ace needs a tiny recharge break. Upgrade to Pro or Premium, or come back when this timer hits zero.'
            : `You have used all ${usage.limit} messages for today. Upgrade to Premium for unlimited messages, or try again after your daily reset.`,
          cooldownUntil: usage.cooldownUntil,
          showUpgrade: true,
        })
        return { blocked: true, cooldownUntil: usage.cooldownUntil }
      }

      useUserStore.getState().updateProfile({
        dailyMessageCount: usage.count,
        messageCooldownUntil: usage.cooldownUntil ? new Date(usage.cooldownUntil).toISOString() : null,
      })
      onUsage?.(usage)
    }

    const previousMessages = useChatStore.getState().messages
    const userMessage = editIndex == null
      ? { role: 'user', content: text }
      : previousMessages[editIndex]
    lastUserTextRef.current = text
    if (editIndex == null) addMessage(userMessage)
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
        } catch (err) {
          console.warn('Unable to fetch linked content:', err)
        }
      }

      // File context
      if (fileContext?.type === 'image') {
        enrichedText += `\n\n[Uploaded image: ${fileContext.name}]\nAnalyze the image itself. Describe relevant visible details, people, objects, layout, and any readable text. Do not guess anyone's identity.`
      } else if (fileContext?.content) {
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
        } catch (err) {
          console.warn('Web search failed:', err)
        }
        setIsSearching(false)
      }

      // ── Step 3: Build prompt ──────────────────────────
      const currentMessages = useChatStore.getState().messages
      const compactableCount = currentMessages.length - 10
      if (compactableCount > summarizedMessageCountRef.current && currentMessages.length > 20) {
        const messagesToSummarize = currentMessages.slice(
          summarizedMessageCountRef.current,
          compactableCount,
        )
        try {
          summaryRef.current = await complete({
            model: MODELS.chat,
            messages: [
              {
                role: 'system',
                content: `Compress the conversation into a concise memory for future replies. Preserve the user's goals, preferences, key facts, decisions, and unresolved questions. Do not invent details. Write the summary in ${profile?.language || 'English'}.`,
              },
              {
                role: 'user',
                content: `${summaryRef.current ? `Previous memory:\n${summaryRef.current}\n\n` : ''}New messages:\n${messagesToSummarize.map((m) => `${m.role}: ${m.content}`).join('\n')}`,
              },
            ],
            temperature: 0.2,
            maxTokens: 700,
          })
          summarizedMessageCountRef.current = compactableCount
          if (user?.uid && convIdRef.current) {
            updateConversationSummary(
              user.uid,
              convIdRef.current,
              summaryRef.current,
              messageOffsetRef.current + summarizedMessageCountRef.current,
            ).catch((err) => console.error('Failed to save conversation summary:', err))
          }
        } catch (err) {
          console.error('Failed to summarize older conversation messages:', err)
        }
      }

      const contextMessages = editIndex == null
        ? currentMessages
        : currentMessages.slice(0, editIndex + 1)
      const basePrompt = buildSystemPrompt(profile, contextMessages, summaryRef.current)
      const fullSystemPrompt = searchSystemContext
        ? basePrompt + '\n\n' + searchSystemContext
        : basePrompt

      const historyMessages = [
        ...contextMessages.slice(0, -1).slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        {
          role: 'user',
          content: fileContext?.type === 'image' && fileContext.imageDataUrl
            ? [
                { type: 'text', text: enrichedText },
                {
                  type: 'image_url',
                  image_url: { url: fileContext.imageDataUrl },
                },
              ]
            : enrichedText,
        },
      ]

      // ── Step 4: Call DeepSeek IMMEDIATELY ────────────
      // Firebase is NOT involved here — pure AI call
      let fullContent = ''

      fullContent = await streamCompletion({
        model: fileContext?.type === 'image' ? MODELS.vision : MODELS.chat,
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
      const assistantMessage = {
        role: 'assistant',
        content: fullContent,
        ...(editIndex != null && previousAssistant?.id ? { id: previousAssistant.id } : {}),
      }
      if (editIndex == null) {
        addMessage(assistantMessage)
      } else {
        const current = useChatStore.getState().messages
        const editedUser = current[editIndex]
        const variants = editedUser.versions || []
        const versionIndex = editedUser.versionIndex ?? variants.length - 1
        variants[versionIndex] = {
          ...variants[versionIndex],
          content: text,
          continuation: [assistantMessage],
        }
        setMessages([
          ...current.slice(0, editIndex),
          { ...editedUser, content: text, versions: variants, versionIndex },
          assistantMessage,
        ])
      }
      setStreamingContent('')

      // ── Step 6: Save to Firebase in background ───────
      // User already sees the response — Firebase runs async
      const title = text.slice(0, 50) + (text.length > 50 ? '...' : '')
      const uid = user?.uid

      if (uid && editIndex == null) {
        // Fire and forget — never blocks the user
        savePromiseRef.current = saveToFirebase(
          uid,
          convIdRef,
          title,
          userMessage,
          assistantMessage,
          setConversations,
          setActiveConversationId,
          bringToTop,
        ).then((savedConvId) => {
          if (savedConvId) {
            console.log(
              '[Chat Save] Background save confirmed:',
              savedConvId
            )
          } else {
            console.error(
              '[Chat Save] Background save was not completed'
            )
          }
        })
      } else if (uid && editIndex != null) {
        const editedUser = useChatStore.getState().messages[editIndex]
        try {
          if (!editedUser.id || !assistantMessage.id || !convIdRef.current) {
            throw new Error('Edited message IDs are not available yet.')
          }
          await Promise.all([
            updateMessage(uid, convIdRef.current, editedUser.id, {
              content: text,
              versions: serializeMessageVersions(editedUser.versions),
              versionIndex: editedUser.versionIndex,
            }),
            updateMessage(uid, convIdRef.current, assistantMessage.id, {
              content: fullContent,
            }),
          ])
        } catch (err) {
          console.error('Failed to save edited message version:', err)
        }
      } else {
        console.error(
          '[Chat Save] Cannot save: user UID is missing'
        )
      }

      // Auto-generate title after 2nd exchange
      const updatedMessages = [...previousMessages, userMessage, assistantMessage]
      if (updatedMessages.length === 4 && uid && convIdRef.current) {
        generateTitle(updatedMessages, uid, convIdRef.current, setConversations)
      }

      if (activeBranchRef.current) {
        const { index, versionIndex } = activeBranchRef.current
        const updated = useChatStore.getState().messages
        const branchRoot = updated[index]
        if (branchRoot?.versions?.[versionIndex]) {
          const versions = [...branchRoot.versions]
          versions[versionIndex] = {
            ...versions[versionIndex],
            continuation: updated.slice(index + 1),
          }
          setMessages(updated.map((message, i) =>
            i === index ? { ...branchRoot, versions } : message
          ))
          if (user?.uid && branchRoot.id && convIdRef.current) {
            updateMessage(user.uid, convIdRef.current, branchRoot.id, {
              versions: serializeMessageVersions(versions),
              versionIndex,
            }).catch((err) => console.error('Failed to save edited conversation branch:', err))
          }
        }
      }

      return usage
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
    } catch (err) {
      console.error('Failed to generate conversation title:', err)
    }
  }

  async function loadConversation(convId) {
    if (!convId || !user?.uid) return
    try {
      const [msgs, savedSummary] = await Promise.all([
        import('../services/memory').then(({ loadMessages }) => loadMessages(user.uid, convId)),
        loadConversationSummary(user.uid, convId),
      ])
      setMessages(msgs)
      summaryRef.current = savedSummary.summary
      messageOffsetRef.current = Math.max(0, savedSummary.messageCount - msgs.length)
      summarizedMessageCountRef.current = Math.max(
        0,
        savedSummary.summarizedMessageCount - messageOffsetRef.current,
      )
      activeBranchRef.current = null
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
    summaryRef.current = ''
    summarizedMessageCountRef.current = 0
    messageOffsetRef.current = 0
    activeBranchRef.current = null
    setFileContext(null)
  }

  async function handleEdit(index, newContent) {
    if (loading) return
    const estimatedTokens = Math.ceil(newContent.length / 4)
    if (estimatedTokens > 3000) {
      addMessage({
        role: 'assistant',
        content: `Your edited message is too long (around ${estimatedTokens} tokens). Please split it into smaller parts.`,
      })
      return
    }
    await savePromiseRef.current
    const current = useChatStore.getState().messages
    const message = current[index]
    if (!message || message.role !== 'user') return

    const versions = [...(message.versions || [{
      content: message.content,
      continuation: current.slice(index + 1),
    }])]
    const currentVersion = message.versionIndex ?? versions.length - 1
    versions[currentVersion] = {
      ...versions[currentVersion],
      content: message.content,
      continuation: current.slice(index + 1),
    }
    const versionIndex = versions.length
    versions.push({ content: newContent, continuation: [] })

    const editedMessage = {
      ...message,
      content: newContent,
      versions,
      versionIndex,
    }
    setMessages([...current.slice(0, index), editedMessage])
    activeBranchRef.current = { index, versionIndex }

    if (index < summarizedMessageCountRef.current) {
      summaryRef.current += `\nThe user revised an earlier request: it is now "${newContent}" rather than "${message.content}". Treat the revised request as authoritative.`
      if (user?.uid && convIdRef.current) {
        updateConversationSummary(
          user.uid,
          convIdRef.current,
          summaryRef.current,
          messageOffsetRef.current + summarizedMessageCountRef.current,
        ).catch((err) => console.error('Failed to update edited conversation summary:', err))
      }
    }

    await send(newContent, {
      editIndex: index,
      previousAssistant: current[index + 1],
    })
  }

  function handleVersionChange(index, versionIndex) {
    if (loading) return
    const current = useChatStore.getState().messages
    const message = current[index]
    if (!message?.versions || versionIndex < 0 || versionIndex >= message.versions.length) return

    const versions = [...message.versions]
    const currentVersion = message.versionIndex ?? versions.length - 1
    versions[currentVersion] = {
      ...versions[currentVersion],
      continuation: current.slice(index + 1),
    }
    const selected = versions[versionIndex]
    const selectedMessage = {
      ...message,
      content: selected.content,
      versions,
      versionIndex,
    }
    setMessages([
      ...current.slice(0, index),
      selectedMessage,
      ...(selected.continuation || []),
    ])
    activeBranchRef.current = { index, versionIndex }
    if (user?.uid && selectedMessage.id && convIdRef.current) {
      const assistant = selected.continuation?.find((item) => item.role === 'assistant')
      const writes = [
        updateMessage(user.uid, convIdRef.current, selectedMessage.id, {
          content: selected.content,
          versions: serializeMessageVersions(versions),
          versionIndex,
        }),
      ]
      if (assistant?.id) {
        writes.push(updateMessage(user.uid, convIdRef.current, assistant.id, {
          content: assistant.content,
        }))
      }
      Promise.all(writes).catch((err) => console.error('Failed to restore message version:', err))
    }
  }

  async function retry() {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    const text = lastUser?.content || lastUserTextRef.current
    if (!text) return
    // drop the failed assistant message, then resend
    const { messages: current } = useChatStore.getState()
    if (current.length && current[current.length - 1]?.role === 'assistant') {
      useChatStore.setState({ messages: current.slice(0, -1) })
    }
    await send(text)
  }

  return {
    messages, streamingContent, loading,
    fileContext, setFileContext,
    isSearching,
    send, retry, loadConversation, startNewChat, handleEdit, handleVersionChange,
  }
}
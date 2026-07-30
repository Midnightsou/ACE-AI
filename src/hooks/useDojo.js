import { useState } from 'react'
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'

import { db } from '../services/firebase'
import { useDojoStore } from '../store/dojoStore'
import { useUserStore } from '../store/userStore'

import { buildDojoChatPrompt } from '../prompts/tools/dojoPrompt'

import { loadToolMessages } from '../services/memory'

import {
  streamCompletion,
  MODELS,
} from '../services/deepseekClient'

export function useDojo() {
  const {
    sources,
    messages,
    sessionId,
    addMessage,
    setMessages,
    setSessionId,
    setGeneratedContent,
    generatedContent,
    clearSession,
  } = useDojoStore()

  const user = useUserStore((s) => s.user)

  const [streamingContent, setStreamingContent] =
    useState('')

  const [loading, setLoading] = useState(false)

  const [generatingTab, setGeneratingTab] =
    useState(null)

  const readySources = sources.filter(
    (s) => !s.loading && !s.error && s.content
  )

  async function streamFromAI(
    systemPrompt,
    userPrompt,
    onChunk
  ) {
    return streamCompletion({
      model: MODELS.chat,

      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],

      temperature: 0.5,
      maxTokens: 4096,

      onChunk: (content) => {
        onChunk?.(content)
      },
    })
  }

  async function loadSession(sid) {
    if (!user?.uid || !sid) return

    clearSession()
    setSessionId(sid)

    try {
      const msgs = await loadToolMessages(user.uid, sid)
      setMessages(msgs)
    } catch (err) {
      console.error('Failed to load dojo session:', err)
    }
  }

  // ── Chat ────────────────────────────────────────────
  async function sendMessage(text) {
    if (
      !text.trim() ||
      loading ||
      readySources.length === 0
    ) {
      return
    }

    const userMessage = {
      role: 'user',
      content: text,
    }

    addMessage(userMessage)

    setLoading(true)
    setStreamingContent('')

    try {
      let currentSessionId = sessionId
      const previewTitle = `Dojo — ${text.slice(0, 40)}`
      const systemPrompt = buildDojoChatPrompt(readySources)
      const cleanHistory = [...messages].slice(-10).map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: typeof m.content === 'string' ? m.content : String(m.content || ''),
      }))

      if (!currentSessionId && user?.uid) {
        const ref = await addDoc(
          collection(db, 'students', user.uid, 'conversations'),
          {
            type: 'tool',
            toolId: 'dojo',
            toolName: 'Dojo',
            icon: '🥋',
            title: previewTitle,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }
        )

        currentSessionId = ref.id
        setSessionId(currentSessionId)
      }

      if (user?.uid && currentSessionId) {
        await addDoc(
          collection(db, 'students', user.uid, 'conversations', currentSessionId, 'messages'),
          {
            role: 'user',
            content: text,
            createdAt: serverTimestamp(),
          }
        )

        await updateDoc(
          doc(db, 'students', user.uid, 'conversations', currentSessionId),
          {
            updatedAt: serverTimestamp(),
            title: previewTitle,
          }
        )
      }

      const fullContent = await streamCompletion({
        model: MODELS.chat,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          ...cleanHistory,
          { role: 'user', content: text },
        ],
        temperature: 0.5,
        maxTokens: 4096,
        onChunk: (chunk) => setStreamingContent(chunk),
      })

      addMessage({
        role: 'assistant',
        content: fullContent,
      })

      setStreamingContent('')

      if (user?.uid && currentSessionId) {
        await addDoc(
          collection(db, 'students', user.uid, 'conversations', currentSessionId, 'messages'),
          {
            role: 'assistant',
            content: fullContent,
            createdAt: serverTimestamp(),
          }
        )

        await updateDoc(
          doc(db, 'students', user.uid, 'conversations', currentSessionId),
          {
            updatedAt: serverTimestamp(),
            title: previewTitle,
          }
        )
      }
    } catch (err) {
      addMessage({
        role: 'assistant',
        content:
          'Something went wrong. Check your connection and try again.',
      })

      console.error('Dojo chat error:', err)
    } finally {
      setLoading(false)
      setStreamingContent('')
    }
  }

  // ── Generate tab content ─────────────────────────────
  async function generateContent(
    tab,
    promptBuilder
  ) {
    if (readySources.length === 0) return

    setGeneratingTab(tab)

    setGeneratedContent(tab, '')

    try {
      const {
        system,
        user: userPrompt,
      } = promptBuilder(readySources)

      const fullContent = await streamFromAI(
        system,
        userPrompt,

        (chunk) => setGeneratedContent(tab, chunk)
      )

      setGeneratedContent(tab, fullContent)
    } catch (err) {
      setGeneratedContent(
        tab,
        'Failed to generate. Try again.'
      )

      console.error(
        `Dojo generate ${tab} error:`,
        err
      )
    } finally {
      setGeneratingTab(null)
    }
  }

  // After generating content (summary, quiz, etc.), save to session:
async function generateContent(tab, promptBuilder) {
  if (readySources.length === 0) return
  setGeneratingTab(tab)
  setGeneratedContent(tab, '')

  try {
    const { system, user: userPrompt } = promptBuilder(readySources)
    const fullContent = await streamCompletion({
      model: MODELS.chat,
      messages: [{ role: 'system', content: system }, { role: 'user', content: userPrompt }],
      temperature: 0.5,
      maxTokens: 4096,
      onChunk: (chunk) => setGeneratedContent(tab, chunk),
    })

    setGeneratedContent(tab, fullContent)

    // Save to Firestore — generated content only, not source documents
    if (user?.uid) {
      const store = useDojoStore.getState()
      await saveDojoSession(user.uid, {
        generatedContent: store.generatedContent,
        sourceMetadata: store.getSourceMetadata(),
        // NO source.content — too large
      })
    }

  } catch (err) {
    setGeneratedContent(tab, 'Failed to generate. Try again.')
  } finally {
    setGeneratingTab(null)
  }
}
  return {
    messages,
    streamingContent,
    loading,
    generatingTab,
    generatedContent,
    readySources,
    sendMessage,
    generateContent,
    streamFromAI,
    loadSession,
  }
}
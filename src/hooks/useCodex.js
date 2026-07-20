import { useState } from 'react'
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useCodexStore } from '../store/codexStore'
import { useUserStore } from '../store/userStore'
import { buildCodexSystemPrompt } from '../prompts/tools/codexPrompt'
import { loadToolMessages } from '../services/memory'

import {
  streamCompletion,
  MODELS,
} from '../services/deepseekClient'

export function useCodex() {
  const {
    messages,
    sessionId,
    addMessage,
    setMessages,
    setSessionId,
    clearMessages,
  } = useCodexStore()

  const user = useUserStore((s) => s.user)

  const [streamingContent, setStreamingContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [language, setLanguage] = useState('auto')

  async function loadSession(sid) {
    if (!user?.uid || !sid) return

    clearMessages()
    setSessionId(sid)

    try {
      const msgs = await loadToolMessages(user.uid, sid)
      setMessages(msgs)
    } catch (err) {
      console.error('Failed to load codex session:', err)
    }
  }

  async function send(text) {
    if (!text.trim() || loading) return

    const userMessage = {
      role: 'user',
      content: text,
    }

    addMessage(userMessage)

    setLoading(true)
    setStreamingContent('')

    try {
      let currentSessionId = sessionId
      const previewTitle = `Codex — ${text.slice(0, 40)}${
        text.length > 40 ? '...' : ''
      }`

      if (!currentSessionId && user?.uid) {
        const ref = await addDoc(
          collection(db, 'students', user.uid, 'conversations'),
          {
            type: 'tool',
            toolId: 'codex',
            toolName: 'Codex',
            icon: '💻',
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

      const history = [...messages, userMessage]

      const fullContent = await streamCompletion({
        model: MODELS.chat,

        messages: [
          {
            role: 'system',
            content: buildCodexSystemPrompt(language),
          },

          ...history.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        ],

        temperature: 0.3,
        maxTokens: 4096,

        onChunk: (content) => {
          setStreamingContent(content)
        },
      })

      const assistantMessage = {
        role: 'assistant',
        content: fullContent,
      }

      addMessage(assistantMessage)

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

      console.error('Codex error:', err)
    } finally {
      setLoading(false)
      setStreamingContent('')
    }
  }

  function startNewSession() {
    clearMessages()
    setSessionId(null)
  }

  return {
    messages,
    streamingContent,
    loading,

    language,
    setLanguage,

    send,
    startNewSession,
    loadSession,
  }
}
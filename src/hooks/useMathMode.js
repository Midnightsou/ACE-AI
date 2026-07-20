import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useMathStore } from '../store/mathStore'
import { useUserStore } from '../store/userStore'
import { buildMathSystemPrompt } from '../prompts/tools/mathPrompt'

import { loadToolMessages } from '../services/memory'

import {
  streamCompletion,
  MODELS,
} from '../services/deepseekClient'

export function useMathMode() {
  const {
    messages,
    sessionId,
    streamingContent,

    addMessage,
    setMessages,
    setStreamingContent,
    setSessionId,
    clearMessages,
  } = useMathStore()

  const user = useUserStore((s) => s.user)

  async function loadSession(sid) {
    if (!user?.uid || !sid) return

    clearMessages()
    setSessionId(sid)

    try {
      const msgs = await loadToolMessages(user.uid, sid)
      setMessages(msgs)
    } catch (err) {
      console.error('Failed to load math session:', err)
    }
  }

  async function send(text) {
    if (!text.trim()) return

    const userMessage = {
      role: 'user',
      content: text,
    }

    addMessage(userMessage)
    setStreamingContent('')

    try {
      let currentSessionId = sessionId
      const previewTitle = `Math — ${text.slice(0, 40)}${
        text.length > 40 ? '...' : ''
      }`

      if (!currentSessionId && user?.uid) {
        const ref = await addDoc(
          collection(db, 'students', user.uid, 'conversations'),
          {
            type: 'tool',
            toolId: 'math',
            toolName: 'Math Mode',
            icon: '🧮',
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
        model: MODELS.reasoner,

        messages: [
          {
            role: 'system',
            content: buildMathSystemPrompt(),
          },

          ...history.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        ],

        temperature: 0.1,
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

      console.error('Math mode error:', err)
    } finally {
      setStreamingContent('')
    }
  }

  return {
    messages,
    streamingContent,

    send,
    clearMessages,
    loadSession,
  }
}
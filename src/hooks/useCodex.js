import { useState, useRef, useEffect } from 'react'
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'

import { db } from '../services/firebase'
import { useCodexStore } from '../store/codexStore'
import { useUserStore } from '../store/userStore'
import { buildCodexSystemPrompt } from '../prompts/tools/codexPrompt'
import { loadToolMessages } from '../services/memory'

import {
  streamCompletion,
  MODELS,
} from '../services/deepseekClient'


// ─────────────────────────────────────────────
// Save Codex conversation in the background.
// This NEVER blocks the AI response.
// ─────────────────────────────────────────────
async function saveCodexToFirebase({
  uid,
  sessionIdRef,
  previewTitle,
  userMessage,
  assistantMessage,
}) {
  try {
    let currentSessionId = sessionIdRef.current

    // Create conversation only if this is a new session
    if (!currentSessionId) {
      const ref = await addDoc(
        collection(db, 'students', uid, 'conversations'),
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
      sessionIdRef.current = currentSessionId
    }

    // Save user message
    await addDoc(
      collection(
        db,
        'students',
        uid,
        'conversations',
        currentSessionId,
        'messages'
      ),
      {
        role: 'user',
        content: userMessage.content,
        createdAt: serverTimestamp(),
      }
    )

    // Save assistant message
    await addDoc(
      collection(
        db,
        'students',
        uid,
        'conversations',
        currentSessionId,
        'messages'
      ),
      {
        role: 'assistant',
        content: assistantMessage.content,
        createdAt: serverTimestamp(),
      }
    )

    // Update conversation metadata
    await updateDoc(
      doc(
        db,
        'students',
        uid,
        'conversations',
        currentSessionId
      ),
      {
        updatedAt: serverTimestamp(),
        title: previewTitle,
      }
    )

    return currentSessionId

  } catch (err) {
    console.error('Background Codex Firebase save failed:', err)
    throw err
  }
}


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

  // Keep the session ID available to background Firebase operations
  const sessionIdRef = useRef(sessionId || null)

  useEffect(() => {
    sessionIdRef.current = sessionId
  }, [sessionId])


  async function loadSession(sid) {
    if (!user?.uid || !sid) return

    clearMessages()
    setSessionId(sid)
    sessionIdRef.current = sid

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

    // Show user message immediately
    addMessage(userMessage)

    setLoading(true)
    setStreamingContent('')

    const previewTitle =
      `Codex — ${text.slice(0, 40)}${text.length > 40 ? '...' : ''}`

    try {
      // ─────────────────────────────────────────────
      // Build history immediately.
      // NO FIREBASE OPERATIONS BEFORE DEEPSEEK.
      // ─────────────────────────────────────────────

      const history = [
        ...messages,
        userMessage,
      ]

      // ─────────────────────────────────────────────
      // CALL DEEPSEEK IMMEDIATELY
      // ─────────────────────────────────────────────

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


      // ─────────────────────────────────────────────
      // SHOW AI RESPONSE IMMEDIATELY
      // ─────────────────────────────────────────────

      const assistantMessage = {
        role: 'assistant',
        content: fullContent,
      }

      addMessage(assistantMessage)

      setStreamingContent('')


      // ─────────────────────────────────────────────
      // SAVE TO FIREBASE IN THE BACKGROUND
      // AI DOES NOT WAIT FOR THIS
      // ─────────────────────────────────────────────

      const uid = user?.uid

      if (uid) {
        saveCodexToFirebase({
          uid,
          sessionIdRef,
          previewTitle,
          userMessage,
          assistantMessage,
        })
          .then((savedSessionId) => {
            if (savedSessionId) {
              sessionIdRef.current = savedSessionId
              setSessionId(savedSessionId)
            }
          })
          .catch((err) => {
            console.error(
              'Failed to save Codex session:',
              err
            )
          })
      }

    } catch (err) {
      setStreamingContent('')

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
    sessionIdRef.current = null
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
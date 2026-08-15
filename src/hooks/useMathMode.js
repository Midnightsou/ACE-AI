import { useRef, useEffect } from 'react'
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'

import { db } from '../services/firebase'
import { useMathStore } from '../store/mathStore'
import { useUserStore } from '../store/userStore'
import { buildMathSystemPrompt } from '../prompts/tools/mathPrompt'
import { loadToolMessages } from '../services/memory'

import {
  streamCompletion,
  MODELS,
} from '../services/deepseekClient'


// Save Math conversation after the AI has responded.
// This runs in the background and never blocks DeepSeek.
async function saveMathToFirebase({
  uid,
  sessionIdRef,
  previewTitle,
  userMessage,
  assistantMessage,
}) {
  try {
    let currentSessionId = sessionIdRef.current

    // Create a new Math conversation if necessary
    if (!currentSessionId) {
      const ref = await addDoc(
        collection(db, 'students', uid, 'conversations'),
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

    // Save AI response
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
    console.error('Background Math Firebase save failed:', err)
    throw err
  }
}


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

  // Keep session ID available to background Firebase saving
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
      console.error('Failed to load math session:', err)
    }
  }


  async function send(text) {
    if (!text.trim()) return

    const userMessage = {
      role: 'user',
      content: text,
    }

    // Show the user's message immediately
    addMessage(userMessage)

    setStreamingContent('')

    const previewTitle =
      `Math — ${text.slice(0, 40)}${text.length > 40 ? '...' : ''}`

    try {
      // Build conversation history.
      // No Firebase calls before DeepSeek.
      const history = [
        ...messages,
        userMessage,
      ]


      // ───────────────────────────────────────
      // CALL DEEPSEEK IMMEDIATELY
      // ───────────────────────────────────────

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


      // Show AI response immediately
      const assistantMessage = {
        role: 'assistant',
        content: fullContent,
      }

      addMessage(assistantMessage)

      setStreamingContent('')


      // ───────────────────────────────────────
      // SAVE TO FIREBASE IN BACKGROUND
      // ───────────────────────────────────────

      const uid = user?.uid

      if (uid) {
        saveMathToFirebase({
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
              'Failed to save Math session:',
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

      console.error('Math mode error:', err)

    } finally {
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

    send,
    clearMessages,
    startNewSession,
    loadSession,
  }
}
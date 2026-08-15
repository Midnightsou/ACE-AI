import { useState, useRef } from 'react'
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

  // Controls sending/loading state
  const [loading, setLoading] = useState(false)

  // Keeps the session ID available even while Firebase works
  const sessionIdRef = useRef(sessionId || null)

  // Keep ref synchronized with store
  sessionIdRef.current = sessionId


  // ─────────────────────────────────────────────
  // LOAD EXISTING SESSION
  // ─────────────────────────────────────────────

  async function loadSession(sid) {
    if (!user?.uid || !sid) return

    clearMessages()

    setSessionId(sid)
    sessionIdRef.current = sid

    try {
      const msgs = await loadToolMessages(user.uid, sid)

      setMessages(msgs)
    } catch (err) {
      console.error(
        'Failed to load math session:',
        err
      )
    }
  }


  // ─────────────────────────────────────────────
  // SAVE TO FIREBASE IN BACKGROUND
  // ─────────────────────────────────────────────

  async function saveToFirebase(
    uid,
    title,
    userMessage,
    assistantContent
  ) {
    try {
      let currentSessionId = sessionIdRef.current

      // Create conversation if this is a new session
      if (!currentSessionId) {
        const ref = await addDoc(
          collection(
            db,
            'students',
            uid,
            'conversations'
          ),
          {
            type: 'tool',
            toolId: 'math',
            toolName: 'Math Mode',
            icon: '🧮',
            title,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }
        )

        currentSessionId = ref.id

        sessionIdRef.current = currentSessionId

        setSessionId(currentSessionId)
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


      // Save AI message
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
          content: assistantContent,
          createdAt: serverTimestamp(),
        }
      )


      // Update conversation
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
          title,
        }
      )

    } catch (err) {
      console.error(
        'Background Math Firebase save failed:',
        err
      )
    }
  }


  // ─────────────────────────────────────────────
  // SEND MESSAGE
  // ─────────────────────────────────────────────

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


    try {
      const previewTitle =
        `Math — ${text.slice(0, 40)}${
          text.length > 40
            ? '...'
            : ''
        }`


      // Build conversation history
      const history = [
        ...messages.slice(-10),
        userMessage,
      ]


      // ─────────────────────────────────────────
      // CALL DEEPSEEK IMMEDIATELY
      // FIREBASE DOES NOT BLOCK THIS
      // ─────────────────────────────────────────

      const fullContent =
        await streamCompletion({
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


      // ─────────────────────────────────────────
      // SHOW AI RESPONSE IMMEDIATELY
      // ─────────────────────────────────────────

      const assistantMessage = {
        role: 'assistant',
        content: fullContent,
      }


      addMessage(assistantMessage)

      setStreamingContent('')


      // ─────────────────────────────────────────
      // SAVE TO FIREBASE IN BACKGROUND
      // DOES NOT BLOCK THE USER
      // ─────────────────────────────────────────

      const uid = user?.uid

      if (uid) {
        saveToFirebase(
          uid,
          previewTitle,
          userMessage,
          fullContent
        )
      }


    } catch (err) {
      setStreamingContent('')

      addMessage({
        role: 'assistant',

        content:
          'Something went wrong. Check your connection and try again.',
      })

      console.error(
        'Math mode error:',
        err
      )

    } finally {

      setLoading(false)

      setStreamingContent('')
    }
  }


  // ─────────────────────────────────────────────
  // START NEW SESSION
  // ─────────────────────────────────────────────

  function startNewSession() {
    clearMessages()

    setSessionId(null)

    sessionIdRef.current = null

    setStreamingContent('')
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
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
import {
  loadToolMessages,
  invalidateConversationCache,
} from '../services/memory'

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

  const [loading, setLoading] = useState(false)

  // Keeps track of the session even while React/Firebase updates
  const sessionIdRef = useRef(sessionId || null)

  // Keep ref synced with Zustand
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
      const msgs = await loadToolMessages(
        user.uid,
        sid
      )

      setMessages(msgs)

    } catch (err) {
      console.error(
        'Failed to load math session:',
        err
      )
    }
  }


  // ─────────────────────────────────────────────
  // SAVE IN BACKGROUND
  // ─────────────────────────────────────────────

  async function saveToFirebase(
    uid,
    title,
    userMessage,
    assistantContent
  ) {
    try {
      let currentSessionId =
        sessionIdRef.current


      // Create session only if this is a new chat
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

        // Update ref immediately
        sessionIdRef.current =
          currentSessionId

        // Update Zustand
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
          content: assistantContent,
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
          title,
        }
      )


      // Important: sidebar cache must know something changed
      invalidateConversationCache(uid)

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


      // Keep recent conversation history
      const history = [
        ...messages.slice(-10),
        userMessage,
      ]


      // ─────────────────────────────────────────
      // CALL AI FIRST
      // FIREBASE DOES NOT BLOCK RESPONSE
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
      // SAVE TO FIRESTORE IN BACKGROUND
      // ─────────────────────────────────────────

      const uid = user?.uid

      if (uid) {
        saveToFirebase(
          uid,
          previewTitle,
          userMessage,
          fullContent
        ).catch((err) => {
          console.error(
            'Math background save failed:',
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
import { useState, useRef, useEffect } from 'react'
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'

import { db } from '../services/firebase'
import { useDojoStore } from '../store/dojoStore'
import { useUserStore } from '../store/userStore'

import { buildDojoChatPrompt } from '../prompts/tools/dojoPrompt'
import {
  loadToolMessages,
  saveDojoSession,
} from '../services/memory'

import {
  streamCompletion,
  MODELS,
} from '../services/deepseekClient'


// ─────────────────────────────────────────────
// Save Dojo chat without blocking the AI
// ─────────────────────────────────────────────
async function saveDojoChatToFirebase({
  uid,
  sessionIdRef,
  previewTitle,
  userMessage,
  assistantMessage,
}) {
  try {
    let currentSessionId = sessionIdRef.current

    // Create session only for a new Dojo chat
    if (!currentSessionId) {
      const ref = await addDoc(
        collection(db, 'students', uid, 'conversations'),
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
        title: previewTitle,
      }
    )

    return currentSessionId

  } catch (err) {
    console.error(
      'Background Dojo Firebase save failed:',
      err
    )

    throw err
  }
}


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


  // Keep session ID available for background Firebase saving
  const sessionIdRef = useRef(sessionId || null)

  useEffect(() => {
    sessionIdRef.current = sessionId
  }, [sessionId])


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
    sessionIdRef.current = sid

    try {
      const msgs = await loadToolMessages(
        user.uid,
        sid
      )

      setMessages(msgs)

    } catch (err) {
      console.error(
        'Failed to load dojo session:',
        err
      )
    }
  }


  // ── Chat ────────────────────────────────────
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

    // Show message immediately
    addMessage(userMessage)

    setLoading(true)
    setStreamingContent('')

    const previewTitle =
      `Dojo — ${text.slice(0, 40)}`

    try {
      const systemPrompt =
        buildDojoChatPrompt(readySources)

      const cleanHistory =
        [...messages]
          .slice(-10)
          .map((m) => ({
            role:
              m.role === 'user'
                ? 'user'
                : 'assistant',

            content:
              typeof m.content === 'string'
                ? m.content
                : String(m.content || ''),
          }))


      // ─────────────────────────────────────
      // CALL AI IMMEDIATELY
      // NO FIREBASE BEFORE THIS
      // ─────────────────────────────────────

      const fullContent =
        await streamCompletion({
          model: MODELS.chat,

          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },

            ...cleanHistory,

            {
              role: 'user',
              content: text,
            },
          ],

          temperature: 0.5,
          maxTokens: 4096,

          onChunk: (chunk) =>
            setStreamingContent(chunk),
        })


      const assistantMessage = {
        role: 'assistant',
        content: fullContent,
      }

      // Show AI response
      addMessage(assistantMessage)

      setStreamingContent('')


      // ─────────────────────────────────────
      // SAVE TO FIREBASE IN BACKGROUND
      // ─────────────────────────────────────

      const uid = user?.uid

      if (uid) {
        saveDojoChatToFirebase({
          uid,
          sessionIdRef,
          previewTitle,
          userMessage,
          assistantMessage,
        })
          .then((savedSessionId) => {
            if (savedSessionId) {
              sessionIdRef.current =
                savedSessionId

              setSessionId(savedSessionId)
            }
          })
          .catch((err) => {
            console.error(
              'Failed to save Dojo chat:',
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
        'Dojo chat error:',
        err
      )

    } finally {
      setLoading(false)
      setStreamingContent('')
    }
  }


  // ── Generate tab content ────────────────────
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

      // AI runs immediately
      const fullContent =
        await streamFromAI(
          system,
          userPrompt,
          (chunk) =>
            setGeneratedContent(
              tab,
              chunk
            )
        )

      setGeneratedContent(
        tab,
        fullContent
      )


      // ─────────────────────────────────────
      // BACKGROUND SAVE
      // ─────────────────────────────────────

      const uid = user?.uid

      if (uid) {
        const store =
          useDojoStore.getState()

        saveDojoSession(uid, {
          generatedContent:
            store.generatedContent,

          sourceMetadata:
            store.getSourceMetadata(),
        }).catch((err) => {
          console.error(
            'Failed to save Dojo content:',
            err
          )
        })
      }

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


  function startNewSession() {
    clearSession()

    setSessionId(null)

    sessionIdRef.current = null
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
    startNewSession,
  }
}
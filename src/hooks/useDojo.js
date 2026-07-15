import { useState } from 'react'

import { useDojoStore } from '../store/dojoStore'
import { useUserStore } from '../store/userStore'

import { buildDojoChatPrompt } from '../prompts/tools/dojoPrompt'

import { saveToolSession } from '../services/memory'

import {
  streamCompletion,
  MODELS,
} from '../services/deepseekClient'

export function useDojo() {
  const {
    sources,
    messages,
    addMessage,
    setGeneratedContent,
    generatedContent,
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
      const systemPrompt = buildDojoChatPrompt(readySources)
      const history = messages.slice(-10).map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: typeof m.content === 'string' ? m.content : String(m.content || ''),
      }))

      const fullContent = await streamCompletion({
        model: MODELS.chat,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          ...history,
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

      if (user?.uid) {
        await saveToolSession(
          user.uid,
          'dojo',
          'Dojo',
          `Dojo — ${text.slice(0, 40)}`,
          '🥋'
        ).catch(() => {})
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
  }
}
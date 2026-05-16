import { useState } from 'react'

import {
  streamCompletion,
  MODELS,
} from '../services/deepseekClient'

export function useCVChat(onCVUpdate) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')

  async function send(currentCV) {
    if (!input.trim() || loading || !currentCV) {
      return
    }

    const userMessage = {
      role: 'user',
      content: input.trim(),
    }

    const newMessages = [...messages, userMessage]

    setMessages(newMessages)

    setInput('')
    setLoading(true)

    const systemPrompt = `You are Ace, an expert CV writer assistant. The user has generated a CV and wants to refine it.

Here is the current CV:
---
${currentCV}
---

The user will ask you to make specific changes. When they do:
- Return the COMPLETE updated CV with the changes applied
- Keep all sections intact unless asked to change them
- Maintain the same plain text format with CAPS section headers
- Never use markdown symbols like ** or ## or ---------
- Never explain what you changed — just return the full updated CV
- If the request is unclear, make a reasonable interpretation and apply it`

    try {
      const fullContent = await streamCompletion({
        model: MODELS.chat,

        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },

          ...newMessages,
        ],

        temperature: 0.7,
        maxTokens: 4096,

        onChunk: (content) => {
          onCVUpdate(content)
        },
      })

      const assistantMessage = {
        role: 'assistant',
        content:
          '✓ Done — CV updated. Keep refining or download when ready.',
      }

      setMessages((prev) => [
        ...prev,
        assistantMessage,
      ])

      return fullContent
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Something went wrong. Try again.',
        },
      ])

      console.error('CV chat error:', err)

      return null
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setMessages([])
    setInput('')
  }

  return {
    messages,
    loading,
    input,
    setInput,
    send,
    reset,
  }
}
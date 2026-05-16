import { useState } from 'react'

import {
  streamCompletion,
  MODELS,
} from '../services/deepseekClient'

export function useEssayChat(onUpdate) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')

  async function send(currentEssay) {
    if (
      !input.trim() ||
      loading ||
      !currentEssay
    ) {
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

    const systemPrompt = `You are Ace, an expert academic writing assistant. The user has an essay they want to refine.

Current essay:
---
${currentEssay}
---

When the user asks for changes:
- Return the COMPLETE updated essay with changes applied
- Maintain academic tone and structure
- Plain text only — no markdown, no asterisks
- Never explain what you changed — just return the full updated essay`

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
          onUpdate(content)
        },
      })

      setMessages((prev) => [
        ...prev,

        {
          role: 'assistant',
          content:
            '✓ Essay updated. Keep refining or download when ready.',
        },
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

      console.error('Essay chat error:', err)

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
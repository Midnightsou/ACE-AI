import { useState } from 'react'

import {
  streamCompletion,
  MODELS,
} from '../services/deepseekClient'

export function useEmailChat(onUpdate) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')

  async function send(currentEmail) {
    if (
      !input.trim() ||
      loading ||
      !currentEmail
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

    const systemPrompt = `You are Ace, an expert email writer. The user has an email they want to refine.

Current email:
---
${currentEmail}
---

When the user asks for changes:
- Return the COMPLETE updated email with changes applied
- Keep the SUBJECT: format on the first line
- Plain text only — no markdown, no asterisks
- Never explain what you changed — just return the full updated email`

    try {
      await streamCompletion({
        model: MODELS.chat,

        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },

          ...newMessages,
        ],

        temperature: 0.7,
        maxTokens: 1024,

        onChunk: (content) => {
          onUpdate(content)
        },
      })

      setMessages((prev) => [
        ...prev,

        {
          role: 'assistant',
          content:
            '✓ Email updated. Keep refining or copy when ready.',
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,

        {
          role: 'assistant',
          content:
            'Something went wrong. Try again.',
        },
      ])

      console.error(
        'Email chat error:',
        err
      )
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
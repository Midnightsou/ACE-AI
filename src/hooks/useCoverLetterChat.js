import { useState } from 'react'

import {
  streamCompletion,
  MODELS,
} from '../services/deepseekClient'

export function useCoverLetterChat(onUpdate) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')

  async function send(currentLetter) {
    if (
      !input.trim() ||
      loading ||
      !currentLetter
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

    const systemPrompt = `You are Ace, an expert cover letter writer. The user has a cover letter they want to refine.

Current cover letter:
---
${currentLetter}
---

When the user asks for changes:
- Return the COMPLETE updated cover letter with changes applied
- Keep the same structure unless asked to change it
- Plain text only — no markdown, no asterisks
- Never explain what you changed — just return the full updated letter`

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
        maxTokens: 2048,

        onChunk: (content) => {
          onUpdate(content)
        },
      })

      setMessages((prev) => [
        ...prev,

        {
          role: 'assistant',
          content:
            '✓ Done — letter updated. Keep refining or download when ready.',
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

      console.error(
        'Cover letter chat error:',
        err
      )

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
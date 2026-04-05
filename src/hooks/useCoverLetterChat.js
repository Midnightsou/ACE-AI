import { useState } from 'react'

const BASE_URL = 'https://api.featherless.ai/v1/chat/completions'

export function useCoverLetterChat(onUpdate) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')

  async function send(currentLetter) {
    if (!input.trim() || loading || !currentLetter) return

    const userMessage = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    const apiKey = import.meta.env.VITE_FEATHERLESS_API_KEY

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
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-ai/DeepSeek-V3.2',
          messages: [
            { role: 'system', content: systemPrompt },
            ...newMessages,
          ],
          temperature: 0.7,
          max_tokens: 2048,
          stream: true,
        }),
      })

      if (!response.ok) throw new Error('Request failed')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          const trimmed = line.trim()
          if (!trimmed || trimmed === 'data: [DONE]') continue
          if (!trimmed.startsWith('data: ')) continue
          try {
            const json = JSON.parse(trimmed.slice(6))
            const delta = json.choices?.[0]?.delta?.content
            if (delta) {
              fullContent += delta
              onUpdate(fullContent)
            }
          } catch { }
        }
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '✓ Done — letter updated. Keep refining or download when ready.' },
      ])

    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Try again.' },
      ])
      console.error('Cover letter chat error:', err)
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setMessages([])
    setInput('')
  }

  return { messages, loading, input, setInput, send, reset }
}
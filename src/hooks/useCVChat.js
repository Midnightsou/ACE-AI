import { useState } from 'react'

const BASE_URL = 'https://api.featherless.ai/v1/chat/completions'

export function useCVChat(onCVUpdate) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')

  async function send(currentCV) {
    if (!input.trim() || loading || !currentCV) return

    const userMessage = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    const apiKey = import.meta.env.VITE_FEATHERLESS_API_KEY

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
          max_tokens: 4096,
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
        const lines = chunk.split('\n')

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed === 'data: [DONE]') continue
          if (!trimmed.startsWith('data: ')) continue
          try {
            const json = JSON.parse(trimmed.slice(6))
            const delta = json.choices?.[0]?.delta?.content
            if (delta) {
              fullContent += delta
              onCVUpdate(fullContent)
            }
          } catch {
            // skip
          }
        }
      }

      const assistantMessage = {
        role: 'assistant',
        content: '✓ Done — CV updated. Keep refining or download when ready.',
      }
      setMessages((prev) => [...prev, assistantMessage])

    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Try again.' },
      ])
      console.error('CV chat error:', err)
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
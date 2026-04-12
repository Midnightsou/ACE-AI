import { useMathStore } from '../store/mathStore'
import { useUserStore } from '../store/userStore'
import { buildMathSystemPrompt } from '../prompts/tools/mathPrompt'
import { saveToolSession } from '../services/memory'

const BASE_URL = 'https://api.featherless.ai/v1/chat/completions'

export function useMathMode() {
  const {
    messages,
    streamingContent,
    addMessage,
    setStreamingContent,
    clearMessages,
  } = useMathStore()

  const user = useUserStore((s) => s.user)

  async function send(text) {
    if (!text.trim()) return

    const userMessage = { role: 'user', content: text }
    addMessage(userMessage)
    setStreamingContent('')

    const apiKey = import.meta.env.VITE_FEATHERLESS_API_KEY

    try {
      const history = [...messages, userMessage]

      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-ai/DeepSeek-R1-0528',
          messages: [
            { role: 'system', content: buildMathSystemPrompt() },
            ...history.map((m) => ({ role: m.role, content: m.content })),
          ],
          temperature: 0.1,
          max_tokens: 4096,
          stream: true,
        }),
      })

      if (!response.ok) throw new Error(`Request failed: ${response.status}`)

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
              setStreamingContent(fullContent)
            }
          } catch { }
        }
      }

      addMessage({ role: 'assistant', content: fullContent })
      setStreamingContent('')

      if (user?.uid) {
        await saveToolSession(
          user.uid,
          'math',
          'Math Mode',
          `Math — ${text.slice(0, 40)}${text.length > 40 ? '...' : ''}`,
          '🧮'
        ).catch(() => { })
      }

    } catch (err) {
      addMessage({
        role: 'assistant',
        content: 'Something went wrong. Check your connection and try again.',
      })
      console.error('Math mode error:', err)
    } finally {
      setStreamingContent('')
    }
  }

  return {
    messages,
    streamingContent,
    send,
    clearMessages,
  }
}
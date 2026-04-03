import { useChatStore } from '../store/chatStore'
import { useUserStore } from '../store/userStore'
import { sendMessage } from '../services/deepseek'

export function useChat() {
  const { messages, loading, addMessage, setLoading } = useChatStore()
  const user = useUserStore((s) => s.user)

  async function send(text) {
    if (!text.trim() || loading) return

    const userMessage = { role: 'user', content: text }
    addMessage(userMessage)
    setLoading(true)

    try {
      const history = [...messages, userMessage]

      const reply = await sendMessage({
        messages: history,
        profile: user?.profile || {},
        apiKey: import.meta.env.VITE_FEATHERLESS_API_KEY,
      })

      addMessage({ role: 'assistant', content: reply })
    } catch (err) {
      const status = err?.response?.status

      const errorMessages = {
        402: 'AI credits are empty. Top up at platform.deepseek.com to continue.',
        401: 'Invalid API key. Check your .env file.',
        429: 'Too many requests. Wait a moment and try again.',
        503: 'DeepSeek servers are down. Try again shortly.',
      }

      addMessage({
        role: 'assistant',
        content: errorMessages[status] || 'Something went wrong. Check your connection and try again.',
      })

      console.error('DeepSeek error:', err)
    } finally {
      setLoading(false)
    }
  }

  return { messages, loading, send }
}
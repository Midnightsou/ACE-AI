import { useState } from 'react'
import { useCodexStore } from '../store/codexStore'
import { useUserStore } from '../store/userStore'
import { buildCodexSystemPrompt } from '../prompts/tools/codexPrompt'
import { saveToolSession, saveToolMessage, loadToolMessages } from '../services/memory'

const BASE_URL = 'https://api.featherless.ai/v1/chat/completions'

export function useCodex() {
  const {
    messages, sessionId, addMessage,
    setMessages, setSessionId, clearMessages,
  } = useCodexStore()

  const user = useUserStore((s) => s.user)
  const [streamingContent, setStreamingContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [language, setLanguage] = useState('auto')

  async function loadSession(sid) {
    if (!user?.uid || !sid) return
    clearMessages()
    setSessionId(sid)
    try {
      const msgs = await loadToolMessages(user.uid, sid)
      setMessages(msgs)
    } catch (err) {
      console.error('Failed to load codex session:', err)
    }
  }

  async function send(text) {
    if (!text.trim() || loading) return

    const userMessage = { role: 'user', content: text }
    addMessage(userMessage)
    setLoading(true)
    setStreamingContent('')

    const apiKey = import.meta.env.VITE_FEATHERLESS_API_KEY

    try {
      let currentSessionId = sessionId

      if (!currentSessionId && user?.uid) {
        currentSessionId = await saveToolSession(
          user.uid, 'codex', 'Codex',
          `Codex — ${text.slice(0, 40)}${text.length > 40 ? '...' : ''}`,
          '💻'
        )
        setSessionId(currentSessionId)
      }

      if (user?.uid && currentSessionId) {
        await saveToolMessage(user.uid, currentSessionId, userMessage)
      }

      const history = [...messages, userMessage]
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-ai/DeepSeek-V3.2',
          messages: [
            { role: 'system', content: buildCodexSystemPrompt(language) },
            ...history.map((m) => ({ role: m.role, content: m.content })),
          ],
          temperature: 0.3,
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

      const assistantMessage = { role: 'assistant', content: fullContent }
      addMessage(assistantMessage)
      setStreamingContent('')

      if (user?.uid && currentSessionId) {
        await saveToolMessage(user.uid, currentSessionId, assistantMessage)
        await saveToolSession(
          user.uid, 'codex', 'Codex',
          `Codex — ${text.slice(0, 40)}${text.length > 40 ? '...' : ''}`,
          '💻'
        )
      }

    } catch (err) {
      addMessage({
        role: 'assistant',
        content: 'Something went wrong. Check your connection and try again.',
      })
      console.error('Codex error:', err)
    } finally {
      setLoading(false)
      setStreamingContent('')
    }
  }

  function startNewSession() {
    clearMessages()
    setSessionId(null)
  }

  return {
    messages, streamingContent, loading,
    language, setLanguage,
    send, startNewSession, loadSession,
  }
}
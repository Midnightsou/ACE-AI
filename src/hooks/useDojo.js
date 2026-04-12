import { useState } from 'react'
import { useDojoStore } from '../store/dojoStore'
import { useUserStore } from '../store/userStore'
import { buildDojoChatPrompt } from '../prompts/tools/dojoPrompt'
import { saveToolSession } from '../services/memory'

const BASE_URL = 'https://api.featherless.ai/v1/chat/completions'

export function useDojo() {
  const {
    sources,
    messages,
    addMessage,
    setGeneratedContent,
    generatedContent,
  } = useDojoStore()

  const user = useUserStore((s) => s.user)
  const [streamingContent, setStreamingContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatingTab, setGeneratingTab] = useState(null)

  const readySources = sources.filter(
    (s) => !s.loading && !s.error && s.content
  )

  async function streamFromAI(systemPrompt, userPrompt, onChunk) {
    const apiKey = import.meta.env.VITE_FEATHERLESS_API_KEY
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
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.5,
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
            onChunk?.(fullContent)
          }
        } catch { }
      }
    }

    return fullContent
  }

  // ── Chat ────────────────────────────────────────────
  async function sendMessage(text) {
    if (!text.trim() || loading || readySources.length === 0) return

    const userMessage = { role: 'user', content: text }
    addMessage(userMessage)
    setLoading(true)
    setStreamingContent('')

    try {
      const systemPrompt = buildDojoChatPrompt(readySources)
      const history = [...messages, userMessage]

      const fullContent = await streamFromAI(
        systemPrompt,
        history.map((m) => `${m.role === 'user' ? 'User' : 'Ace'}: ${m.content}`).join('\n'),
        (chunk) => setStreamingContent(chunk)
      )

      addMessage({ role: 'assistant', content: fullContent })
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
        content: 'Something went wrong. Check your connection and try again.',
      })
      console.error('Dojo chat error:', err)
    } finally {
      setLoading(false)
      setStreamingContent('')
    }
  }

  // ── Generate tab content ─────────────────────────────
  async function generateContent(tab, promptBuilder) {
    if (readySources.length === 0) return

    setGeneratingTab(tab)
    setGeneratedContent(tab, '')

    try {
      const { system, user: userPrompt } = promptBuilder(readySources)
      const fullContent = await streamFromAI(
        system,
        userPrompt,
        (chunk) => setGeneratedContent(tab, chunk)
      )
      setGeneratedContent(tab, fullContent)
    } catch (err) {
      setGeneratedContent(tab, 'Failed to generate. Try again.')
      console.error(`Dojo generate ${tab} error:`, err)
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
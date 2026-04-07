import { useState } from 'react'
import { useUserStore } from '../store/userStore'
import { useToolHistoryStore } from '../store/toolHistoryStore'
import { saveToolOutput, loadToolHistory, deleteToolOutput, saveToolSession } from '../services/toolHistory'
import { getToolById } from '../tools/registry'

const BASE_URL = 'https://api.featherless.ai/v1/chat/completions'

export function useTool(toolId) {
  const user = useUserStore((s) => s.user)
  const { addOutput, setHistory, setLoading, getHistory, removeOutput } = useToolHistoryStore()

  const [output, setOutput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [loading, setLoadingLocal] = useState(false)
  const [error, setError] = useState(null)
  const [historyLoaded, setHistoryLoaded] = useState(false)

  async function loadHistory() {
    if (!user?.uid || !toolId || historyLoaded) return
    setLoading(toolId, true)
    try {
      const history = await loadToolHistory(user.uid, toolId)
      setHistory(toolId, history)
      setHistoryLoaded(true)
    } catch (err) {
      console.error('Failed to load tool history:', err)
    } finally {
      setLoading(toolId, false)
    }
  }

  async function generate(systemPrompt, userPrompt, metadata = {}) {
    setLoadingLocal(true)
    setStreaming(true)
    setOutput('')
    setError(null)

    const apiKey = import.meta.env.VITE_FEATHERLESS_API_KEY

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
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.8,
          max_tokens: 4096,
          stream: true,
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.message || `Request failed: ${response.status}`)
      }

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
              setOutput(fullContent)
            }
          } catch {
            // Incomplete chunk — skip
          }
        }
      }

      // Save to Firestore
      if (user?.uid && fullContent) {
        const saved = await saveToolOutput(user.uid, toolId, {
          output: fullContent,
          ...metadata,
        })

        addOutput(toolId, {
          id: saved,
          output: fullContent,
          ...metadata,
          createdAt: new Date(),
        })

        const toolMeta = getToolById(toolId)
        if (toolMeta && user?.uid) {
          const preview = metadata?.fullName
            ? `${toolMeta.name} — ${metadata.fullName}`
            : metadata?.company
              ? `${toolMeta.name} — ${metadata.company}`
              : metadata?.topic
                ? `${toolMeta.name} — ${metadata.topic.slice(0, 40)}`
                : metadata?.targetRole
                  ? `${toolMeta.name} — ${metadata.targetRole}`
                  : toolMeta.name

          await saveToolSession(
            user.uid,
            toolId,
            toolMeta.name,
            preview,
            toolMeta.icon
          ).catch(() => {})
        }
      }

      return fullContent

    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.')
      console.error('Tool error:', err)
      return null
    } finally {
      setLoadingLocal(false)
      setStreaming(false)
    }
  }

  async function deleteOutput(outputId) {
    if (!user?.uid) return
    try {
      await deleteToolOutput(user.uid, toolId, outputId)
      removeOutput(toolId, outputId)
    } catch (err) {
      console.error('Failed to delete output:', err)
    }
  }

  function reset() {
    setOutput('')
    setError(null)
  }

  return {
    output,
    streaming,
    loading,
    error,
    history: getHistory(toolId),
    generate,
    loadHistory,
    deleteOutput,
    reset,
  }
}